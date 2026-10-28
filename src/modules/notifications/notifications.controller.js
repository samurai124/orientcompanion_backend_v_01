import notificationService from './notifications.service.js';
import { sendSuccess } from '../../utils/response.js';

class NotificationsController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      return sendSuccess(res, notifications, 200);
    } catch (error) {
      return next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.user.id, req.params.id);
      return sendSuccess(res, updated, 200);
    } catch (error) {
      return next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new NotificationsController();
