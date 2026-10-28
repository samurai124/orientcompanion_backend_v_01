import subscriptionsService from './subscriptions.service.js';
import { sendSuccess } from '../../utils/response.js';

class SubscriptionsController {
  async getPlans(req, res, next) {
    try {
      const plans = await subscriptionsService.getPlans();
      return sendSuccess(res, plans, 200);
    } catch (error) {
      return next(error);
    }
  }

  async checkout(req, res, next) {
    try {
      const subscription = await subscriptionsService.checkout(req.user.id, req.body.planCode);
      return sendSuccess(res, subscription, 201);
    } catch (error) {
      return next(error);
    }
  }

  async getMySubscription(req, res, next) {
    try {
      const result = await subscriptionsService.getMySubscription(req.user.id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  async cancelSubscription(req, res, next) {
    try {
      await subscriptionsService.cancelSubscription(req.user.id);
      return sendSuccess(res, { message: 'Subscription cancelled successfully' }, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new SubscriptionsController();
