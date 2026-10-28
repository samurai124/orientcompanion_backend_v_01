import express from 'express';
import concoursController from './concours.controller.js';
import {
  createConcoursSchema,
  updateConcoursSchema,
  createQuestionSchema,
  bulkQuestionsSchema,
  createMockExamSchema,
  createStudyPlanSchema,
  updateTaskStatusSchema,
  submitExamAttemptSchema,
  askTutorSchema,
  listQuestionsQuerySchema
} from './concours.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';
import requirePremium from '../../middlewares/premium.js';
import { entityIdParamSchema } from '../admin/admin.schema.js';

const router = express.Router();

/**
 * @swagger
 * /concours:
 *   get:
 *     summary: List all major Moroccan admission entrance exams (ENSA, Médecine, etc.)
 *     tags: [Concours]
 *     responses:
 *       200:
 *         description: List of concours
 */
router.get('/concours', concoursController.getConcoursList);

/**
 * @swagger
 * /concours/{id}:
 *   get:
 *     summary: Get single concours details with subjects and mock exams
 *     tags: [Concours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Concours details
 */
router.get('/concours/:id', validate({ params: entityIdParamSchema }), concoursController.getConcoursById);

// --- Premium Features ---
/**
 * @swagger
 * /study-plans:
 *   post:
 *     summary: Generate custom smart study plan spreading topics and scheduling mock exams (Premium)
 *     tags: [Concours - Study Plans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [concoursId, hoursPerWeek, examDate]
 *             properties:
 *               concoursId: { type: integer, example: 1 }
 *               hoursPerWeek: { type: integer, example: 10 }
 *               examDate: { type: string, format: date-time, example: "2024-07-20T08:30:00Z" }
 *     responses:
 *       201:
 *         description: Study plan generated with scheduled tasks
 *       403:
 *         description: Premium required
 */
router.post(
  '/study-plans',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ body: createStudyPlanSchema }),
  concoursController.createStudyPlan
);

/**
 * @swagger
 * /study-plans/me:
 *   get:
 *     summary: Get current active study plans and tasks (Premium)
 *     tags: [Concours - Study Plans]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active study plans
 */
router.get(
  '/study-plans/me',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  concoursController.getMyStudyPlans
);

/**
 * @swagger
 * /study-tasks/{id}:
 *   patch:
 *     summary: Update task progress status (TODO, IN_PROGRESS, DONE)
 *     tags: [Concours - Study Plans]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *     responses:
 *       200:
 *         description: Task updated
 */
router.patch(
  '/study-tasks/:id',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ params: entityIdParamSchema, body: updateTaskStatusSchema }),
  concoursController.updateTaskStatus
);

/**
 * @swagger
 * /study-plans/{id}/regenerate:
 *   post:
 *     summary: Regenerate study plan incorporating new weak topics (Premium)
 *     tags: [Concours - Study Plans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Plan regenerated
 */
router.post(
  '/study-plans/:id/regenerate',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ params: entityIdParamSchema }),
  concoursController.regenerateStudyPlan
);

// --- Question Bank & Mock Exams (Premium) ---
/**
 * @swagger
 * /question-bank:
 *   get:
 *     summary: Browse past concours questions with filters (Premium)
 *     tags: [Concours - Mock Exams]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: concoursId
 *         schema: { type: integer }
 *       - in: query
 *         name: subjectCode
 *         schema: { type: string }
 *       - in: query
 *         name: topic
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated questions
 */
router.get(
  '/question-bank',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ query: listQuestionsQuerySchema }),
  concoursController.getQuestionBank
);

/**
 * @swagger
 * /mock-exams/{id}/start:
 *   post:
 *     summary: Start a timed mock exam (Questions returned without answers, timer started) (Premium)
 *     tags: [Concours - Mock Exams]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mock exam questions and attempt session
 */
router.post(
  '/mock-exams/:id/start',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ params: entityIdParamSchema }),
  concoursController.startMockExam
);

/**
 * @swagger
 * /mock-exams/{id}/submit:
 *   post:
 *     summary: Submit mock exam answers for server-side scoring and explanations (Premium)
 *     tags: [Concours - Mock Exams]
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
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: object
 *                 example: { "1": 1, "2": 0, "3": 2 }
 *     responses:
 *       200:
 *         description: Exam attempt results with score by subject/topic and full explanations
 */
router.post(
  '/mock-exams/:id/submit',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ params: entityIdParamSchema, body: submitExamAttemptSchema }),
  concoursController.submitMockExam
);

/**
 * @swagger
 * /exam-attempts/me:
 *   get:
 *     summary: Get past mock exam attempt history for current student (Premium)
 *     tags: [Concours - Mock Exams]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Past exam attempts
 */
router.get(
  '/exam-attempts/me',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  concoursController.getMyAttempts
);

// --- AI Tutor (Premium) ---
/**
 * @swagger
 * /tutor/ask:
 *   post:
 *     summary: Ask AI Concours Tutor (Grounded in stored official explanations, daily limit) (Premium)
 *     tags: [Concours - AI Tutor]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId: { type: integer, example: 1 }
 *               questionText: { type: string, example: "Comment résoudre rapidement les intégrales par parties au concours ENSA ?" }
 *     responses:
 *       200:
 *         description: Tutor explanation or advice
 *       403:
 *         description: Daily limit exceeded or premium required
 */
router.post(
  '/tutor/ask',
  authenticate,
  authorize('STUDENT'),
  requirePremium,
  validate({ body: askTutorSchema }),
  concoursController.askTutor
);

// --- Admin / Counselor CRUD for Concours ---
router.post(
  '/admin/concours',
  authenticate,
  authorize('ADMIN', 'COUNSELOR'),
  validate({ body: createConcoursSchema }),
  concoursController.createConcours
);

router.put(
  '/admin/concours/:id',
  authenticate,
  authorize('ADMIN', 'COUNSELOR'),
  validate({ params: entityIdParamSchema, body: updateConcoursSchema }),
  concoursController.updateConcours
);

router.delete(
  '/admin/concours/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: entityIdParamSchema }),
  concoursController.deleteConcours
);

router.post(
  '/admin/questions',
  authenticate,
  authorize('ADMIN', 'COUNSELOR'),
  validate({ body: createQuestionSchema }),
  concoursController.createQuestion
);

router.post(
  '/admin/questions/bulk',
  authenticate,
  authorize('ADMIN', 'COUNSELOR'),
  validate({ body: bulkQuestionsSchema }),
  concoursController.bulkCreateQuestions
);

router.post(
  '/admin/mock-exams',
  authenticate,
  authorize('ADMIN', 'COUNSELOR'),
  validate({ body: createMockExamSchema }),
  concoursController.createMockExam
);

export default router;
