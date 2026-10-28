import express from 'express';
import assessmentController from './assessment.controller.js';
import { submitAssessmentSchema } from './assessment.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

/**
 * @swagger
 * /assessment/questionnaire:
 *   get:
 *     summary: Retrieve the 30-question RIASEC psychometric questionnaire
 *     tags: [Assessment]
 *     responses:
 *       200:
 *         description: RIASEC questionnaire questions
 */
router.get('/questionnaire', assessmentController.getQuestionnaire);

/**
 * @swagger
 * /assessment/submit:
 *   post:
 *     summary: Submit RIASEC answers and compute orientation scores (0-100)
 *     tags: [Assessment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [questionId, score]
 *                   properties:
 *                     questionId: { type: integer, example: 1 }
 *                     score: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *     responses:
 *       200:
 *         description: Computed RIASEC scores and profile
 */
router.post(
  '/submit',
  authenticate,
  authorize('STUDENT'),
  validate({ body: submitAssessmentSchema }),
  assessmentController.submitAssessment
);

export default router;
