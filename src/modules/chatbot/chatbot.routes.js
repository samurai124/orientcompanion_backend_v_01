import express from 'express';
import chatbotController from './chatbot.controller.js';
import { chatMessageSchema } from './chatbot.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /chatbot/message:
 *   post:
 *     summary: Send message to the state-machine orientation chatbot
 *     tags: [Chatbot]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, content]
 *             properties:
 *               sessionId: { type: string, example: "session-xyz-123" }
 *               content: { type: string, example: "Bonjour, je suis en 2ème année Bac Sciences Maths A" }
 *     responses:
 *       200:
 *         description: Chatbot assistant response
 */
router.post('/message', validate({ body: chatMessageSchema }), chatbotController.sendMessage);

export default router;
