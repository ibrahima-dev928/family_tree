const http = require('http');
const env = require('./config/env');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { initSocketServer } = require('./sockets/socket.server');
const { startReminderJob } = require('./jobs/eventReminders.job');

async function start() {
  await connectDatabase();

  const server = http.createServer(app);

  initSocketServer(server);
  startReminderJob();

  server.listen(env.port, () => {
    console.log(`✓ Serveur démarré sur http://localhost:${env.port}`);
    console.log(`  Environnement : ${env.nodeEnv}`);
  });

  const shutdown = async () => {
    console.log('\nArrêt du serveur...');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Échec du démarrage du serveur :', err);
  process.exit(1);
});