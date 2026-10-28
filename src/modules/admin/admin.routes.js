import express from 'express';
import adminController from './admin.controller.js';
import {
  createSchoolSchema,
  updateSchoolSchema,
  createFiliereSchema,
  updateFiliereSchema,
  createRequirementSchema,
  updateRequirementSchema,
  createCutoffSchema,
  updateCutoffSchema,
  createDocumentSchema,
  updateDocumentSchema,
  createProcessSchema,
  updateProcessSchema,
  updateUserStatusSchema,
  listUsersQuerySchema,
  entityIdParamSchema
} from './admin.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Retrieve system-wide analytics and orientation statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List platform users with filter by role, status, and pagination
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [STUDENT, COUNSELOR, ADMIN] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, SUSPENDED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', validate({ query: listUsersQuerySchema }), adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status (ACTIVE or SUSPENDED)
 *     tags: [Admin]
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
 *               status: { type: string, enum: [ACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch('/users/:id/status', validate({ params: entityIdParamSchema, body: updateUserStatusSchema }), adminController.updateUserStatus);

// --- School CRUD ---
router.post('/schools', validate({ body: createSchoolSchema }), adminController.createSchool);
router.put('/schools/:id', validate({ params: entityIdParamSchema, body: updateSchoolSchema }), adminController.updateSchool);
router.delete('/schools/:id', validate({ params: entityIdParamSchema }), adminController.deleteSchool);

// --- Filière CRUD ---
router.post('/filieres', validate({ body: createFiliereSchema }), adminController.createFiliere);
router.put('/filieres/:id', validate({ params: entityIdParamSchema, body: updateFiliereSchema }), adminController.updateFiliere);
router.delete('/filieres/:id', validate({ params: entityIdParamSchema }), adminController.deleteFiliere);

// --- Admission Requirements CRUD ---
router.post('/requirements', validate({ body: createRequirementSchema }), adminController.createRequirement);
router.put('/requirements/:id', validate({ params: entityIdParamSchema, body: updateRequirementSchema }), adminController.updateRequirement);
router.delete('/requirements/:id', validate({ params: entityIdParamSchema }), adminController.deleteRequirement);

// --- Historical Cutoffs CRUD ---
router.post('/cutoffs', validate({ body: createCutoffSchema }), adminController.createCutoff);
router.put('/cutoffs/:id', validate({ params: entityIdParamSchema, body: updateCutoffSchema }), adminController.updateCutoff);
router.delete('/cutoffs/:id', validate({ params: entityIdParamSchema }), adminController.deleteCutoff);

// --- Required Documents CRUD ---
router.post('/documents', validate({ body: createDocumentSchema }), adminController.createDocument);
router.put('/documents/:id', validate({ params: entityIdParamSchema, body: updateDocumentSchema }), adminController.updateDocument);
router.delete('/documents/:id', validate({ params: entityIdParamSchema }), adminController.deleteDocument);

// --- Application Processes CRUD ---
router.post('/processes', validate({ body: createProcessSchema }), adminController.createProcess);
router.put('/processes/:id', validate({ params: entityIdParamSchema, body: updateProcessSchema }), adminController.updateProcess);
router.delete('/processes/:id', validate({ params: entityIdParamSchema }), adminController.deleteProcess);

export default router;
