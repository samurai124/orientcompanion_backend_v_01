import express from 'express';
import applicationsController from './applications.controller.js';
import {
  createApplicationSchema,
  updateChecklistItemSchema,
  applicationIdParamSchema,
  checklistItemParamSchema
} from './applications.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';
import upload from '../../middlewares/upload.js';

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Create application for a filière and auto-generate required documents checklist
 *     tags: [Applications]
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
 *         description: Application created with checklist
 */
router.post('/', validate({ body: createApplicationSchema }), applicationsController.createApplication);

/**
 * @swagger
 * /applications/me:
 *   get:
 *     summary: List all applications for current student with checklist status
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/me', applicationsController.getApplications);

/**
 * @swagger
 * /applications/{id}/progress:
 *   get:
 *     summary: Get application progress percentage, next deadline, and missing mandatory documents
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Progress details
 */
router.get('/:id/progress', validate({ params: applicationIdParamSchema }), applicationsController.getProgress);

/**
 * @swagger
 * /applications/{id}/checklist/{itemId}:
 *   patch:
 *     summary: Update checklist item status (TODO, IN_PROGRESS, DONE) or notes
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Checklist item updated
 */
router.patch(
  '/:id/checklist/:itemId',
  validate({ params: checklistItemParamSchema, body: updateChecklistItemSchema }),
  applicationsController.updateChecklistItem
);

/**
 * @swagger
 * /applications/{id}/checklist/{itemId}/upload:
 *   post:
 *     summary: Upload supporting document file (PDF, JPG, PNG, max 5MB)
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 */
router.post(
  '/:id/checklist/:itemId/upload',
  validate({ params: checklistItemParamSchema }),
  upload.single('file'),
  applicationsController.uploadDocument
);

export default router;
