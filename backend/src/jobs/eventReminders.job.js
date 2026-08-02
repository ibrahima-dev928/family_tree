const cron = require('node-cron');
const { prisma } = require('../config/database');
const notificationsService = require('../modules/notifications/notifications.service');

async function processReminders() {
  const dueReminders = await prisma.eventReminder.findMany({
    where: { sent: false, remindAt: { lte: new Date() } },
    include: {
      event: {
        include: { rsvps: { select: { userId: true } } },
      },
    },
  });

  for (const reminder of dueReminders) {
    const { event } = reminder;

    // Notifie tous ceux qui ont répondu à l'événement (yes/maybe/no)
    for (const rsvp of event.rsvps) {
      await notificationsService.create({
        userId: rsvp.userId,
        type: 'event',
        title: `Rappel : ${event.title}`,
        body: `L'événement approche — ${new Date(event.eventDate).toLocaleString('fr-FR')}`,
        link: `/events/${event.id}`,
      });
    }

    await prisma.eventReminder.update({
      where: { id: reminder.id },
      data: { sent: true },
    });

    console.log(`✓ Rappel envoyé pour l'événement "${event.title}"`);
  }
}

function startReminderJob() {
  // Toutes les 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processReminders().catch((err) => {
      console.error('Erreur lors du traitement des rappels :', err);
    });
  });
  console.log('✓ Job de rappels d\'événements démarré (toutes les 15 min)');
}

module.exports = { startReminderJob, processReminders };