import cron from 'node-cron';
import prisma from '../config/prisma.js';
import notificationService from '../modules/notifications/notifications.service.js';

/**
 * Daily cron job checking application deadlines at 30, 7, and 1 day remaining.
 * Runs every day at 08:00 AM (0 8 * * *).
 */
export const checkDeadlineReminders = async () => {
  try {
    const activeApplications = await prisma.studentApplication.findMany({
      where: {
        status: { in: ['DRAFT', 'SUBMITTED', 'WAITLISTED'] }
      },
      include: {
        student: { select: { userId: true, user: { select: { firstName: true } } } },
        filiere: {
          include: {
            school: {
              include: {
                applicationProcesses: true
              }
            }
          }
        }
      }
    });

    const now = new Date();
    const targetDays = [30, 7, 1];

    for (const app of activeApplications) {
      const processes = app.filiere.school.applicationProcesses || [];

      for (const p of processes) {
        const deadline = new Date(p.closeDate);
        const msRemaining = deadline.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

        if (targetDays.includes(daysRemaining)) {
          const title = `Rappel d'échéance : J-${daysRemaining} pour ${app.filiere.name}`;
          const body = (
            `Attention, il ne vous reste plus que ${daysRemaining} jour(s) pour finaliser votre dossier ` +
            `de candidature pour ${app.filiere.school.name} (clôture le ${deadline.toLocaleDateString('fr-FR')}). ` +
            `Vérifiez votre checklist de documents sur OrientCompanion.`
          );

          await notificationService.notify(
            app.student.userId,
            'DEADLINE_REMINDER',
            title,
            body,
            true
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ Error executing deadline reminders cron job:', error);
  }
};

export const startRemindersJob = () => {
  // Run daily at 08:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running daily application deadline reminders job...');
    checkDeadlineReminders();
  });
};

export default startRemindersJob;
