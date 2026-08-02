const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

const personSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  birthDate: true,
  deathDate: true,
  user: { select: { memberNumber: true } },
};

/**
 * Retourne l'arbre complet : toutes les personnes approuvées,
 * plus toutes les relations (parent-enfant et unions),
 * sous une forme que le frontend peut assembler visuellement.
 */
async function getFullTree() {
  const persons = await prisma.person.findMany({
    where: { validationStatus: 'approved' },
    select: personSummarySelect,
  });

  const parentChildRelations = await prisma.parentChildRelation.findMany({
    select: { parentId: true, childId: true, relationType: true },
  });

  const partnerships = await prisma.partnership.findMany({
    select: {
      id: true,
      person1Id: true,
      person2Id: true,
      status: true,
      unionDate: true,
    },
  });

  return { persons, parentChildRelations, partnerships };
}

/**
 * Retourne le sous-arbre centré sur une personne :
 * ses parents, ses enfants, ses partenaires, et les enfants de ses partenaires.
 * Utile pour afficher une vue "recentrée" comme sur la maquette.
 */
async function getSubtree(personId) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { ...personSummarySelect, bio: true, occupation: true, birthPlace: true },
  });

  if (!person) {
    throw new AppError('Personne introuvable', 404);
  }

  const [asChild, asParent, asPartner1, asPartner2] = await Promise.all([
    prisma.parentChildRelation.findMany({
      where: { childId: personId },
      include: { parent: { select: personSummarySelect } },
    }),
    prisma.parentChildRelation.findMany({
      where: { parentId: personId },
      include: { child: { select: personSummarySelect } },
    }),
    prisma.partnership.findMany({
      where: { person1Id: personId },
      include: { person2: { select: personSummarySelect } },
    }),
    prisma.partnership.findMany({
      where: { person2Id: personId },
      include: { person1: { select: personSummarySelect } },
    }),
  ]);

  const parents = asChild.map((r) => r.parent);
  const children = asParent.map((r) => r.child);
  const partners = [
    ...asPartner1.map((p) => ({ ...p.person2, partnershipStatus: p.status })),
    ...asPartner2.map((p) => ({ ...p.person1, partnershipStatus: p.status })),
  ];

  // Frères et sœurs : toute personne partageant au moins un parent, hors soi-même
  const parentIds = parents.map((p) => p.id);
  let siblings = [];
  if (parentIds.length > 0) {
    const siblingRelations = await prisma.parentChildRelation.findMany({
      where: { parentId: { in: parentIds }, childId: { not: personId } },
      include: { child: { select: personSummarySelect } },
    });
    const seen = new Set();
    siblings = siblingRelations
      .map((r) => r.child)
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  }

  return { person, parents, children, partners, siblings };
}

module.exports = { getFullTree, getSubtree };