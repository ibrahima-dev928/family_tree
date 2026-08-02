const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

async function list(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Crée une notification pour un utilisateur.
 * Fonction utilitaire réutilisée par d'autres modules (events, validations, messaging...).
 */
async function create({ userId, type, title, body, link }) {
  return prisma.notification.create({
    data: { userId, type, title, body: body || null, link: link || null },
  });
}

async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw new AppError('Notification introuvable', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}

module.exports = { list, create, markAsRead, markAllAsRead };