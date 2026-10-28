import prisma from '../config/prisma.js';
import { forbidden, unauthorized } from '../utils/errors.js';

/**
 * Middleware enforcing active PREMIUM subscription requirement.
 */
export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(unauthorized('Authentication required before verifying premium status'));
    }

    // Admins have bypass access to preview features
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
        endsAt: { gt: new Date() },
        plan: { code: 'PREMIUM' }
      }
    });

    if (!activeSubscription) {
      return next(
        forbidden(
          'Cette fonctionnalité est réservée aux abonnés Concours Companion Premium.',
          null,
          'PREMIUM_REQUIRED'
        )
      );
    }

    req.subscription = activeSubscription;
    return next();
  } catch (error) {
    return next(error);
  }
};

export default requirePremium;
