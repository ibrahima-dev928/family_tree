const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../config/database');
const env = require('../../config/env');
const { generateMemberNumber } = require('../../utils/memberNumber');
const { AppError } = require('../../middlewares/error.middleware');

const SALT_ROUNDS = 10;

function generateTokens(user) {
  const payload = {
    id: user.id,
    role: user.role,
    memberNumber: user.memberNumber,
  };

  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

async function register({ firstName, lastName, email, password, phone, birthDate, gender }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Un compte existe déjà avec cet email', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const memberNumber = await generateMemberNumber();

  // Transaction : on crée la fiche Person ET le compte User ensemble,
  // liés l'un à l'autre, ou rien du tout en cas d'erreur.
  const user = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName,
        lastName,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        validationStatus: 'approved', // la fiche de son propre compte est auto-validée
      },
    });

    return tx.user.create({
      data: {
        personId: person.id,
        memberNumber,
        email,
        passwordHash,
        phone: phone || null,
        role: 'member',
      },
    });
  });

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      memberNumber: user.memberNumber,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  if (!user.isActive) {
    throw new AppError('Ce compte a été désactivé', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      memberNumber: user.memberNumber,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch (err) {
    throw new AppError('Refresh token invalide ou expiré', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || !user.isActive) {
    throw new AppError('Utilisateur introuvable ou désactivé', 401);
  }

  const tokens = generateTokens(user);
  return tokens;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Mot de passe actuel incorrect', 401);
  }

  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return { success: true };
}

module.exports = { register, login, refreshAccessToken, changePassword };