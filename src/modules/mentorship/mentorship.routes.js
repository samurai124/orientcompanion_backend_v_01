import express from 'express';
import mentorshipController from './mentorship.controller.js';
import {
  createSessionSchema,
  completeSessionSchema,
  rateSessionSchema,
  createAvailabilitySlotSchema
} from './mentorship.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';
import { entityIdParamSchema } from '../admin/admin.schema.js';

const router = express.Router();

router.use(authenticate);

router.get('/counselors', mentorshipController.getCounselors);

/**
 * @swagger
 * /mentorship/sessions:
 *   post:
 *     summary: Request a 1-on-1 orientation mentorship session with a counselor (at least 24h ahead)
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [counselorId, requestedStart, requestedEnd, subject]
 *             properties:
 *               counselorId: { type: integer, example: 1 }
 *               requestedStart: { type: string, format: date-time, example: "2024-08-01T10:00:00Z" }
 *               requestedEnd: { type: string, format: date-time, example: "2024-08-01T11:00:00Z" }
 *               subject: { type: string, example: "Orientation choix CPGE vs ENSA" }
 *     responses:
 *       201:
 *         description: Mentorship session requested
 */
router.post(
  '/mentorship/sessions',
  authorize('STUDENT'),
  validate({ body: createSessionSchema }),
  mentorshipController.requestSession
);

/**
 * @swagger
 * /mentorship/sessions:
 *   get:
 *     summary: List mentorship sessions for the current authenticated user
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/mentorship/sessions', mentorshipController.getMySessions);

/**
 * @swagger
 * /mentorship/sessions/{id}/accept:
 *   patch:
 *     summary: Counselor accepts requested session (generates Jitsi video link)
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Session scheduled
 */
router.patch(
  '/mentorship/sessions/:id/accept',
  authorize('COUNSELOR', 'ADMIN'),
  validate({ params: entityIdParamSchema }),
  mentorshipController.acceptSession
);

/**
 * @swagger
 * /mentorship/sessions/{id}/reject:
 *   patch:
 *     summary: Counselor rejects requested session
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Session rejected
 */
router.patch(
  '/mentorship/sessions/:id/reject',
  authorize('COUNSELOR', 'ADMIN'),
  validate({ params: entityIdParamSchema }),
  mentorshipController.rejectSession
);

/**
 * @swagger
 * /mentorship/sessions/{id}/cancel:
 *   patch:
 *     summary: Cancel a requested or scheduled session
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Session cancelled
 */
router.patch(
  '/mentorship/sessions/:id/cancel',
  validate({ params: entityIdParamSchema }),
  mentorshipController.cancelSession
);

/**
 * @swagger
 * /mentorship/sessions/{id}/complete:
 *   patch:
 *     summary: Counselor marks session as completed and provides orientation report
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [report]
 *             properties:
 *               report: { type: string, example: "L'élève a validé son projet d'ingénierie logicielle. Recommandé : ENSA ou FST." }
 *     responses:
 *       200:
 *         description: Session completed
 */
router.patch(
  '/mentorship/sessions/:id/complete',
  authorize('COUNSELOR', 'ADMIN'),
  validate({ params: entityIdParamSchema, body: completeSessionSchema }),
  mentorshipController.completeSession
);

/**
 * @swagger
 * /mentorship/sessions/{id}/rating:
 *   post:
 *     summary: Student rates a completed mentorship session (1-5 stars)
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *     responses:
 *       200:
 *         description: Rating submitted
 */
router.post(
  '/mentorship/sessions/:id/rating',
  authorize('STUDENT'),
  validate({ params: entityIdParamSchema, body: rateSessionSchema }),
  mentorshipController.rateSession
);

// --- Counselor Availability Slots ---
/**
 * @swagger
 * /counselors/me/availability:
 *   get:
 *     summary: Get weekly availability slots for the logged-in counselor
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of availability slots
 */
router.get(
  '/counselors/me/availability',
  authorize('COUNSELOR'),
  mentorshipController.getAvailability
);

/**
 * @swagger
 * /counselors/me/availability:
 *   post:
 *     summary: Add new weekly availability slot
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dayOfWeek, startTime, endTime]
 *             properties:
 *               dayOfWeek: { type: integer, minimum: 0, maximum: 6, example: 1 }
 *               startTime: { type: string, example: "09:00" }
 *               endTime: { type: string, example: "12:00" }
 *     responses:
 *       201:
 *         description: Slot added
 */
router.post(
  '/counselors/me/availability',
  authorize('COUNSELOR'),
  validate({ body: createAvailabilitySlotSchema }),
  mentorshipController.addAvailability
);

/**
 * @swagger
 * /counselors/me/availability/{id}:
 *   delete:
 *     summary: Remove availability slot
 *     tags: [Mentorship]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Slot removed
 */
router.delete(
  '/counselors/me/availability/:id',
  authorize('COUNSELOR'),
  validate({ params: entityIdParamSchema }),
  mentorshipController.deleteAvailability
);

export default router;
