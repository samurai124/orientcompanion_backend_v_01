import prisma from '../../config/prisma.js';
import mailer from '../../utils/mailer.js';
import { notFound, forbidden } from '../../utils/errors.js';

class NotificationService {
  /**
   * Central dispatch method to notify a user via database and optionally email.
   */
  async notify(userId, type, title, body, sendEmail = false) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body
      }
    });

    if (sendEmail) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true }
      });

      if (user && user.email) {
        await mailer.sendEmail({
          to: user.email,
          subject: `[OrientCompanion] ${title}`,
          text: `Bonjour ${user.firstName},\n\n${body}\n\nL'équipe OrientCompanion`
        });
      }
    }

    return notification;
  }

  /**
   * Get notifications for a user.
   */
  async getUserNotifications(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(userId, notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw notFound('Notification not found');
    }

    if (notification.userId !== userId) {
      throw forbidden('You do not own this notification');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
  }
}

export default new NotificationService();
