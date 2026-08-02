const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

async function checkPersonsExist(ids) {
  const count = await prisma.person.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw new AppError("Une ou plusieurs personnes référencées n'existent pas", 404);
  }
}

/**
 * Crée un lien parent-enfant.
 * Admin : direct. Membre : demande en attente.
 */
async function createParentChild(data, requestingUser) {
  await checkPersonsExist([data.parentId, data.childId]);

  if (data.parentId === data.childId) {
    throw new AppError('Une personne ne peut pas être son propre parent', 422);
  }

  if (requestingUser.role === 'admin') {
    const existing = await prisma.parentChildRelation.findUnique({
      where: { parentId_childId: { parentId: data.parentId, childId: data.childId } },
    });
    if (existing) {
      throw new AppError('Ce lien parent-enfant existe déjà', 409);
    }
    return prisma.parentChildRelation.create({ data });
  }

  return prisma.personEditRequest.create({
    data: {
      requestedById: requestingUser.id,
      changeType: 'add_relation',
      payload: { kind: 'parent_child', ...data },
      status: 'pending',
    },
  });
}

/**
 * Crée une union (mariage, partenariat...).
 * Admin : direct. Membre : demande en attente.
 */
async function createPartnership(data, requestingUser) {
  await checkPersonsExist([data.person1Id, data.person2Id]);

  if (data.person1Id === data.person2Id) {
    throw new AppError('Une personne ne peut pas être son propre partenaire', 422);
  }

  const normalized = {
    ...data,
    unionDate: data.unionDate ? new Date(data.unionDate) : null,
  };

  if (requestingUser.role === 'admin') {
    return prisma.partnership.create({ data: normalized });
  }

  return prisma.personEditRequest.create({
    data: {
      requestedById: requestingUser.id,
      changeType: 'add_relation',
      payload: { kind: 'partnership', ...data },
      status: 'pending',
    },
  });
}

/**
 * Modifie le statut d'une union existante (ex: divorce, veuvage).
 * Toujours direct (pas soumis à validation — c'est une mise à jour d'un fait déjà établi).
 */
async function updatePartnership(partnershipId, data) {
  const existing = await prisma.partnership.findUnique({ where: { id: partnershipId } });
  if (!existing) {
    throw new AppError('Union introuvable', 404);
  }

  return prisma.partnership.update({
    where: { id: partnershipId },
    data: {
      status: data.status,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
}

async function deleteParentChild(relationId, requestingUser) {
  const relation = await prisma.parentChildRelation.findUnique({ where: { id: relationId } });
  if (!relation) {
    throw new AppError('Relation introuvable', 404);
  }

  // Seul un admin peut supprimer directement une relation (action irréversible et sensible)
  if (requestingUser.role !== 'admin') {
    throw new AppError('Seul un administrateur peut supprimer une relation', 403);
  }

  await prisma.parentChildRelation.delete({ where: { id: relationId } });
  return { deleted: true };
}

async function deletePartnership(partnershipId, requestingUser) {
  const partnership = await prisma.partnership.findUnique({ where: { id: partnershipId } });
  if (!partnership) {
    throw new AppError('Union introuvable', 404);
  }

  if (requestingUser.role !== 'admin') {
    throw new AppError('Seul un administrateur peut supprimer une union', 403);
  }

  await prisma.partnership.delete({ where: { id: partnershipId } });
  return { deleted: true };
}

module.exports = { createParentChild, createPartnership, updatePartnership, deleteParentChild, deletePartnership };