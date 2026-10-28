import prisma from '../../config/prisma.js';
import paymentProvider from './paymentProvider.js';
import { notFound, badRequest } from '../../utils/errors.js';

class SubscriptionsService {
  /**
   * List available subscription plans.
   */
  async getPlans() {
    return prisma.plan.findMany({
      orderBy: { priceMad: 'asc' }
    });
  }

  /**
   * Subscribe user to a plan using payment provider.
   */
  async checkout(userId, planCode) {
    const plan = await prisma.plan.findUnique({
      where: { code: planCode }
    });

    if (!plan) {
      throw notFound(`Plan with code '${planCode}' not found`);
    }

    // Process payment (Simulated)
    const paymentResult = await paymentProvider.processPayment({
      amountMad: plan.priceMad,
      userId,
      planCode
    });

    if (!paymentResult.success) {
      throw badRequest('Payment transaction failed');
    }

    const startsAt = new Date();
    const endsAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions and activate the new one
    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' }
      });

      const newSub = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'ACTIVE',
          startsAt,
          endsAt
        },
        include: { plan: true }
      });

      await tx.payment.create({
        data: {
          userId,
          subscriptionId: newSub.id,
          amountMad: plan.priceMad,
          provider: paymentResult.provider,
          status: 'SUCCESS'
        }
      });

      return newSub;
    });

    return subscription;
  }

  /**
   * Get current user's active subscription and recent payment history.
   */
  async getMySubscription(userId) {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endsAt: { gt: new Date() }
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      activeSubscription: activeSubscription || null,
      isPremium: activeSubscription?.plan?.code === 'PREMIUM',
      paymentHistory: payments
    };
  }

  /**
   * Cancel currently active subscription.
   */
  async cancelSubscription(userId) {
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endsAt: { gt: new Date() }
      }
    });

    if (!activeSub) {
      throw badRequest('No active subscription found to cancel');
    }

    return prisma.subscription.update({
      where: { id: activeSub.id },
      data: { status: 'CANCELLED' }
    });
  }
}

export default new SubscriptionsService();
