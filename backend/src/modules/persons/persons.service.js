const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

const personInclude = {
  parentRelations: {
    include: { child: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
  childRelations: {
    include: { parent: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
  partnershipsAsPerson1: {
    include: { person2: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
  partnershipsAsPerson2: {
    include: { person1: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } },
  },
  user: { select: { memberNumber: true } },
};

async function getById(personId) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: personInclude,
  });

  if (!person) {
    throw new AppError('Personne introuvable', 404);
  }

  return person;
}

async function list({ search } = {}) {
  return prisma.person.findMany({
    where: {
      validationStatus: 'approved',
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      birthDate: true,
      deathDate: true,
      user: { select: { memberNumber: true } },
    },
    orderBy: { lastName: 'asc' },
    take: 100,
  });
}

/**
 * Crée une nouvelle fiche personne.
 * - Admin : création directe, immédiatement visible dans l'arbre.
 * - Membre : crée une demande en attente (person_edit_request), rien n'est visible tant que non approuvé.
 */
async function createPerson(data, requestingUser) {
  if (requestingUser.role === 'admin') {
    return prisma.person.create({
      data: { ...normalizeDates(data), validationStatus: 'approved' },
    });
  }

  const request = await prisma.personEditRequest.create({
    data: {
      personId: null, // pas encore de fiche : elle sera créée à l'approbation
      requestedById: requestingUser.id,
      changeType: 'create',
      payload: data,
      status: 'pending',
    },
  });

  return { pendingRequest: request };
}

/**
 * Propose ou applique une modification d'une fiche existante.
 */
async function updatePerson(personId, data, requestingUser) {
  const existing = await prisma.person.findUnique({ where: { id: personId } });
  if (!existing) {
    throw new AppError('Personne introuvable', 404);
  }

  // Un membre modifiant SA PROPRE fiche n'a pas besoin de validation admin
  const requester = await prisma.user.findUnique({ where: { id: requestingUser.id } });
  const isSelf = requester?.personId === personId;

  if (requestingUser.role === 'admin' || isSelf) {
    return prisma.person.update({
      where: { id: personId },
      data: normalizeDates(data),
    });
  }

  const request = await prisma.personEditRequest.create({
    data: {
      personId,
      requestedById: requestingUser.id,
      changeType: 'update',
      payload: data,
      status: 'pending',
    },
  });

  return { pendingRequest: request };
}

/**
 * Propose ou applique la suppression d'une fiche.
 */
async function deletePerson(personId, requestingUser) {
  const existing = await prisma.person.findUnique({ where: { id: personId } });
  if (!existing) {
    throw new AppError('Personne introuvable', 404);
  }

  if (requestingUser.role === 'admin') {
    await prisma.person.delete({ where: { id: personId } });
    return { deleted: true };
  }

  const request = await prisma.personEditRequest.create({
    data: {
      personId,
      requestedById: requestingUser.id,
      changeType: 'delete',
      payload: {},
      status: 'pending',
    },
  });

  return { pendingRequest: request };
}

// Convertit les chaînes ISO reçues en objets Date pour Prisma
function normalizeDates(data) {
  const result = { ...data };
  if (result.birthDate) result.birthDate = new Date(result.birthDate);
  if (result.deathDate) result.deathDate = new Date(result.deathDate);
  return result;
}

async function updatePhoto(personId, photoUrl) {
  const existing = await prisma.person.findUnique({ where: { id: personId } });
  if (!existing) {
    throw new AppError('Personne introuvable', 404);
  }

  return prisma.person.update({
    where: { id: personId },
    data: { photoUrl },
  });
}

async function getRelations() {
  return prisma.parentChildRelations.findMany({
    select: {
      parentId: true,
      childId: true,
    },
  });
}

module.exports = { getById, list, createPerson, updatePerson, deletePerson, updatePhoto, getRelations };