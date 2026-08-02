const { prisma } = require('../../config/database');
const { AppError } = require('../../middlewares/error.middleware');

const conversationInclude = {
  participants: {
    include: { user: { select: { id: true, memberNumber: true, email: true } } },
  },
};

/**
 * Liste les conversations de l'utilisateur connecté, avec le dernier message.
 */
async function listConversations(userId) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      ...conversationInclude,
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return conversations;
}

/**
 * Crée une conversation (privée ou groupe).
 * Ajoute automatiquement le créateur comme participant s'il n'est pas dans la liste.
 */
async function createConversation({ participantIds, isGroup, title }, creatorId) {
  const allParticipantIds = Array.from(new Set([creatorId, ...participantIds]));

  if (!isGroup && allParticipantIds.length === 2) {
    // Conversation privée : vérifie si elle existe déjà entre ces deux personnes
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: allParticipantIds.map((id) => ({
          participants: { some: { userId: id } },
        })),
      },
      include: conversationInclude,
    });
    if (existing) return existing;
  }

  return prisma.conversation.create({
    data: {
      isGroup: !!isGroup,
      title: title || null,
      createdById: creatorId,
      participants: {
        create: allParticipantIds.map((userId) => ({ userId })),
      },
    },
    include: conversationInclude,
  });
}

async function assertParticipant(conversationId, userId) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new AppError("Vous ne faites pas partie de cette conversation", 403);
  }
}

async function getMessages(conversationId, userId, { cursor, limit = 30 } = {}) {
  await assertParticipant(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { sentAt: 'desc' },
    take: Number(limit),
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: { sender: { select: { id: true, memberNumber: true, email: true } } },
  });

  return messages.reverse(); // ordre chronologique pour l'affichage
}

/**
 * Enregistre un message en base (utilisé aussi bien par la route REST de secours
 * que par le handler Socket.IO temps réel).
 */
async function createMessage(conversationId, senderId, { content, attachmentUrl }) {
  await assertParticipant(conversationId, senderId);

  return prisma.message.create({
    data: { conversationId, senderId, content, attachmentUrl: attachmentUrl || null },
    include: { sender: { select: { id: true, memberNumber: true, email: true } } },
  });
}

async function markAsRead(conversationId, userId) {
  await assertParticipant(conversationId, userId);

  return prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}

module.exports = {
  listConversations,
  createConversation,
  getMessages,
  createMessage,
  markAsRead,
  assertParticipant,
};