const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

const eventInclude = {
  createdBy: { select: { id: true, memberNumber: true, email: true } },
  rsvps: {
    select: {
      response: true,
      guestsCount: true,
      user: { select: { id: true, memberNumber: true, email: true } },
    },
  },
};

function normalizeDates(data) {
  const result = { ...data };
  if (result.eventDate) result.eventDate = new Date(result.eventDate);
  if (result.endDate) result.endDate = new Date(result.endDate);
  return result;
}

async function list({ eventType, upcoming } = {}) {
  return prisma.event.findMany({
    where: {
      ...(eventType && { eventType }),
      ...(upcoming === 'true' && { eventDate: { gte: new Date() } }),
    },
    include: {
      createdBy: { select: { id: true, memberNumber: true } },
      _count: { select: { rsvps: true } },
    },
    orderBy: { eventDate: 'asc' },
  });
}

async function getById(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: eventInclude,
  });

  if (!event) {
    throw new AppError('Événement introuvable', 404);
  }

  return event;
}

async function create(data, creatorId) {
  return prisma.event.create({
    data: { ...normalizeDates(data), createdById: creatorId },
    include: eventInclude,
  });
}

async function update(eventId, data, requestingUser) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError('Événement introuvable', 404);
  }

  if (event.createdById !== requestingUser.id && requestingUser.role !== 'admin') {
    throw new AppError("Vous n'êtes pas autorisé à modifier cet événement", 403);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: normalizeDates(data),
    include: eventInclude,
  });
}

async function remove(eventId, requestingUser) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError('Événement introuvable', 404);
  }

  if (event.createdById !== requestingUser.id && requestingUser.role !== 'admin') {
    throw new AppError("Vous n'êtes pas autorisé à supprimer cet événement", 403);
  }

  await prisma.event.delete({ where: { id: eventId } });
  return { deleted: true };
}

/**
 * Crée ou met à jour la réponse RSVP d'un utilisateur pour un événement.
 * (upsert : une seule réponse par utilisateur et par événement, grâce à @@unique([eventId, userId]))
 */
async function rsvp(eventId, userId, data) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError('Événement introuvable', 404);
  }

  return prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: {
      eventId,
      userId,
      response: data.response,
      guestsCount: data.guestsCount || 0,
      respondedAt: new Date(),
    },
    update: {
      response: data.response,
      guestsCount: data.guestsCount || 0,
      respondedAt: new Date(),
    },
  });
}

async function getRsvps(eventId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new AppError('Événement introuvable', 404);
  }

  return prisma.eventRsvp.findMany({
    where: { eventId },
    include: { user: { select: { id: true, memberNumber: true, email: true } } },
  });
}

module.exports = { list, getById, create, update, remove, rsvp, getRsvps };