const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

function normalizeDates(data) {
  const result = { ...data };
  if (result.birthDate) result.birthDate = new Date(result.birthDate);
  if (result.deathDate) result.deathDate = new Date(result.deathDate);
  return result;
}

async function listPending() {
  return prisma.personEditRequest.findMany({
    where: { status: 'pending' },
    include: {
      person: { select: { id: true, firstName: true, lastName: true } },
      requestedBy: { select: { id: true, memberNumber: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function approve(requestId, reviewerId, reviewNote) {
  const request = await prisma.personEditRequest.findUnique({ where: { id: requestId } });

  if (!request) {
    throw new AppError('Demande introuvable', 404);
  }
  if (request.status !== 'pending') {
    throw new AppError('Cette demande a déjà été traitée', 409);
  }

  // On applique le changement réel selon son type, dans une transaction
  const result = await prisma.$transaction(async (tx) => {
    let affectedPerson = null;

    if (request.changeType === 'create') {
      affectedPerson = await tx.person.create({
        data: { ...normalizeDates(request.payload), validationStatus: 'approved' },
      });
    }

    if (request.changeType === 'update') {
      affectedPerson = await tx.person.update({
        where: { id: request.personId },
        data: normalizeDates(request.payload),
      });
    }

    if (request.changeType === 'delete') {
      await tx.person.delete({ where: { id: request.personId } });
    }

    const updatedRequest = await tx.personEditRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedById: reviewerId,
        reviewNote: reviewNote || null,
        reviewedAt: new Date(),
        // Si c'était une création, on relie la demande à la fiche nouvellement créée
        ...(affectedPerson && !request.personId && { personId: affectedPerson.id }),
      },
    });

    return { request: updatedRequest, person: affectedPerson };
  });

  return result;
}

async function reject(requestId, reviewerId, reviewNote) {
  const request = await prisma.personEditRequest.findUnique({ where: { id: requestId } });

  if (!request) {
    throw new AppError('Demande introuvable', 404);
  }
  if (request.status !== 'pending') {
    throw new AppError('Cette demande a déjà été traitée', 409);
  }

  return prisma.personEditRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      reviewedById: reviewerId,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
    },
  });
}

module.exports = { listPending, approve, reject };