const { prisma } = require('../../config/database');
const bcrypt = require('bcrypt');
const { AppError } = require('../../middlewares/error.middleware');

// Champs sûrs à renvoyer publiquement (jamais passwordHash)
const publicUserSelect = {
  id: true,
  memberNumber: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  person: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      bio: true,
      occupation: true,
      birthDate: true,
    },
  },
};

async function getById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  return user;
}

async function updateProfile(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  // Le téléphone est sur User, le reste (photo, bio, métier) est sur Person
  const { phone, photoUrl, bio, occupation } = data;

  await prisma.$transaction(async (tx) => {
    if (phone !== undefined) {
      await tx.user.update({ where: { id: userId }, data: { phone } });
    }
    if (user.personId && (photoUrl !== undefined || bio !== undefined || occupation !== undefined)) {
      await tx.person.update({
        where: { id: user.personId },
        data: {
          ...(photoUrl !== undefined && { photoUrl }),
          ...(bio !== undefined && { bio }),
          ...(occupation !== undefined && { occupation }),
        },
      });
    }
  });

  return getById(userId);
}

/**
 * Recherche par numéro de membre exact OU par nom/prénom partiel.
 * Utilisé par l'annuaire et la messagerie.
 */
async function search(query) {
  if (!query || query.trim().length < 2) {
    throw new AppError('La recherche doit contenir au moins 2 caractères', 422);
  }

  const trimmed = query.trim();

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { memberNumber: { equals: trimmed.toUpperCase() } },
        { person: { firstName: { contains: trimmed, mode: 'insensitive' } } },
        { person: { lastName: { contains: trimmed, mode: 'insensitive' } } },
      ],
    },
    select: publicUserSelect,
    take: 20,
  });

  return users;
}

async function updateRole(targetUserId, newRole) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: publicUserSelect,
  });
}

async function deactivate(targetUserId) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
    select: publicUserSelect,
  });
}

async function updateEmail(userId, { email, currentPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Mot de passe incorrect', 401);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new AppError('Cet email est déjà utilisé par un autre compte', 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { email },
    select: publicUserSelect,
  });
}

module.exports = { getById, updateProfile, search, updateRole, deactivate, updateEmail };