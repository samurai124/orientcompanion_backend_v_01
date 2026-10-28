import express from 'express';
import subscriptionsController from './subscriptions.controller.js';
import { checkoutSchema } from './subscriptions.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: List all orientation subscription plans (FREE, PREMIUM)
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Available plans
 */
router.get('/plans', subscriptionsController.getPlans);

/**
 * @swagger
 * /subscriptions/checkout:
 *   post:
 *     summary: Subscribe to a plan via simulated payment provider
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planCode]
 *             properties:
 *               planCode: { type: string, enum: [FREE, PREMIUM], example: "PREMIUM" }
 *     responses:
 *       201:
 *         description: Subscription activated
 */
router.post('/subscriptions/checkout', authenticate, validate({ body: checkoutSchema }), subscriptionsController.checkout);

/**
 * @swagger
 * /subscriptions/me:
 *   get:
 *     summary: Get current authenticated user subscription status and payment history
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription details
 */
router.get('/subscriptions/me', authenticate, subscriptionsController.getMySubscription);

/**
 * @swagger
 * /subscriptions/cancel:
 *   post:
 *     summary: Cancel current active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post('/subscriptions/cancel', authenticate, subscriptionsController.cancelSubscription);

export default router;
