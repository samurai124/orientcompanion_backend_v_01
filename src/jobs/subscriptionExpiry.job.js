import cron from 'node-cron';
import prisma from '../config/prisma.js';
import notificationService from '../modules/notifications/notifications.service.js';

/**
 * Daily cron job checking and expiring overdue subscriptions.
 * Runs daily at midnight (0 0 * * *).
 */
export const checkSubscriptionExpirations = async () => {
  try {
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lt: new Date() }
      },
      include: {
        user: { select: { id: true, firstName: true } },
        plan: { select: { name: true } }
      }
    });

    if (expiredSubscriptions.length === 0) return;

    for (const sub of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' }
      });

      await notificationService.notify(
        sub.user.id,
        'SUBSCRIPTION_EXPIRED',
        'Votre abonnement est arrivé à échéance',
        `Votre formule "${sub.plan.name}" a expiré. Renouvelez votre abonnement pour continuer à profiter de toutes les fonctionnalités Premium de préparation aux concours.`,
        true
      );
    }

    console.log(`✅ Expired ${expiredSubscriptions.length} overdue subscriptions.`);
  } catch (error) {
    console.error('❌ Error executing subscription expiry job:', error);
  }
};

export const startSubscriptionExpiryJob = () => {
  // Run daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running daily subscription expiry job...');
    checkSubscriptionExpirations();
  });
};

export default startSubscriptionExpiryJob;
