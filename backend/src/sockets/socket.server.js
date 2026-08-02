const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { registerMessagingHandlers } = require('../modules/messaging/messaging.socket');

let io;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigin, credentials: false },
  });

  const messagingNamespace = io.of('/messaging');

  // Authentification à la connexion : le client doit envoyer son JWT
  // dans socket.handshake.auth.token
  messagingNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentification requise'));
    }
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret);
      socket.user = payload; // { id, role, memberNumber }
      next();
    } catch (err) {
      next(new Error('Token invalide ou expiré'));
    }
  });

  messagingNamespace.on('connection', (socket) => {
    console.log(`✓ Socket connecté : ${socket.user.memberNumber}`);
    registerMessagingHandlers(messagingNamespace, socket);

    socket.on('disconnect', () => {
      console.log(`✗ Socket déconnecté : ${socket.user.memberNumber}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO n'a pas été initialisé");
  }
  return io;
}

module.exports = { initSocketServer, getIO };