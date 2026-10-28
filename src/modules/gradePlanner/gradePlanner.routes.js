import express from 'express';
import gradePlannerController from './gradePlanner.controller.js';
import {
  createGoalSchema,
  simulateGoalSchema,
  goalIdParamSchema
} from './gradePlanner.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /grade-planner/goals:
 *   post:
 *     summary: "Set a target filière goal (free: 1 active goal, premium: unlimited)"
 *     tags: [Grade Planner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filiereId]
 *             properties:
 *               filiereId: { type: integer, example: 4 }
 *     responses:
 *       201:
 *         description: Goal computed and saved
 *       403:
 *         description: Free quota exceeded (Premium required)
 */
router.post('/goals', validate({ body: createGoalSchema }), gradePlannerController.createGoal);

/**
 * @swagger
 * /grade-planner/goals:
 *   get:
 *     summary: List all active grade target goals for current student
 *     tags: [Grade Planner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active grade goals
 */
router.get('/goals', gradePlannerController.getGoals);

/**
 * @swagger
 * /grade-planner/goals/{id}:
 *   delete:
 *     summary: Delete a target grade goal
 *     tags: [Grade Planner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Goal deleted
 */
router.delete('/goals/:id', validate({ params: goalIdParamSchema }), gradePlannerController.deleteGoal);

/**
 * @swagger
 * /grade-planner/simulate:
 *   post:
 *     summary: Simulate hypothetical grades on a target filière without saving
 *     tags: [Grade Planner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filiereId, hypotheticalGrades]
 *             properties:
 *               filiereId: { type: integer, example: 4 }
 *               hypotheticalGrades:
 *                 type: object
 *                 example: { "MATH": 18.0, "PC": 16.5, "FR": 15.0, "EN": 16.0 }
 *     responses:
 *       200:
 *         description: Simulation results and target breakdown
 */
router.post('/simulate', validate({ body: simulateGoalSchema }), gradePlannerController.simulate);

export default router;
