import express from 'express';
import studentsController from './students.controller.js';
import {
  updateStudentProfileSchema,
  bulkUpsertGradesSchema,
  studentIdParamSchema
} from './students.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /students/me:
 *   get:
 *     summary: Get current authenticated student profile
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student profile details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Requires STUDENT role)
 */
router.get('/me', authorize('STUDENT'), studentsController.getMe);

/**
 * @swagger
 * /students/me:
 *   put:
 *     summary: Update current student profile details
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bacTrack: { type: string, example: "SM_A" }
 *               bacYear: { type: integer, example: 2024 }
 *               region: { type: string, example: "Rabat-Salé-Kénitra" }
 *               stage: { type: string, enum: [PRE_BAC, POST_BAC, CONCOURS_PREP] }
 *               preferences: { type: object, example: { cities: ["Rabat", "Casablanca"], sectors: ["Engineering"] } }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/me', authorize('STUDENT'), validate({ body: updateStudentProfileSchema }), studentsController.updateMe);

/**
 * @swagger
 * /students/me/grades:
 *   get:
 *     summary: Get all grades for the authenticated student
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of grades
 */
router.get('/me/grades', authorize('STUDENT'), studentsController.getGrades);

/**
 * @swagger
 * /students/me/grades:
 *   put:
 *     summary: Bulk upsert academic grades (0-20 scale)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grades]
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [subjectCode, gradeValue, period]
 *                   properties:
 *                     subjectCode: { type: string, example: "MATH" }
 *                     gradeValue: { type: number, minimum: 0, maximum: 20, example: 17.5 }
 *                     period: { type: string, example: "NATIONAL" }
 *     responses:
 *       200:
 *         description: Grades upserted successfully
 */
router.put('/me/grades', authorize('STUDENT'), validate({ body: bulkUpsertGradesSchema }), studentsController.upsertGrades);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student details by ID (Counselor or Admin only)
 *     tags: [Students]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student profile and grades
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Student not found
 */
router.get('/:id', authorize('COUNSELOR', 'ADMIN'), validate({ params: studentIdParamSchema }), studentsController.getStudentById);

export default router;
