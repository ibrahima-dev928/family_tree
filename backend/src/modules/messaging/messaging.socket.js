const messagingService = require('./messaging.service');

/**
 * Enregistre tous les handlers d'événements Socket.IO pour un socket connecté.
 * Appelé une fois par connexion, depuis socket.server.js
 */
function registerMessagingHandlers(namespace, socket) {
  const userId = socket.user.id;

  // Le client rejoint une conversation (une "room" Socket.IO)
  socket.on('conversation:join', async ({ conversationId }) => {
    try {
      await messagingService.assertParticipant(conversationId, userId);
      socket.join(conversationId);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('conversation:leave', ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // Envoi d'un message : sauvegarde en base, puis diffusion à tous les participants connectés
  socket.on('message:send', async ({ conversationId, content, attachmentUrl }) => {
    try {
      const message = await messagingService.createMessage(conversationId, userId, {
        content,
        attachmentUrl,
      });

      // Diffuse le message à tous les clients ayant rejoint cette room (y compris l'expéditeur)
      namespace.to(conversationId).emit('message:new', message);
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  // Indicateur "en train d'écrire"
  socket.on('typing:start', ({ conversationId }) => {
    socket.to(conversationId).emit('user:typing', { conversationId, userId, typing: true });
  });

  socket.on('typing:stop', ({ conversationId }) => {
    socket.to(conversationId).emit('user:typing', { conversationId, userId, typing: false });
  });

  // Accusé de lecture
  socket.on('conversation:read', async ({ conversationId }) => {
    try {
      await messagingService.markAsRead(conversationId, userId);
      socket.to(conversationId).emit('message:read', { conversationId, userId });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });
}

module.exports = { registerMessagingHandlers };