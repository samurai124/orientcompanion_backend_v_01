import express from 'express';
import schoolsController from './schools.controller.js';
import {
  listSchoolsQuerySchema,
  schoolIdParamSchema,
  listFilieresQuerySchema,
  filiereIdParamSchema
} from './schools.schema.js';
import validate from '../../middlewares/validate.js';

const router = express.Router();

/**
 * @swagger
 * /schools:
 *   get:
 *     summary: List higher education schools with filters & pagination
 *     tags: [Schools]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of schools
 */
router.get('/schools', validate({ query: listSchoolsQuerySchema }), schoolsController.getSchools);

/**
 * @swagger
 * /schools/{id}:
 *   get:
 *     summary: Get school details with filières, documents, and admission processes
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: School details
 *       404:
 *         description: School not found
 */
router.get('/schools/:id', validate({ params: schoolIdParamSchema }), schoolsController.getSchoolById);

/**
 * @swagger
 * /schools/{id}/requirements:
 *   get:
 *     summary: Get required documents, calendar dates, and application steps for a school
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Application requirements
 *       404:
 *         description: School not found
 */
router.get('/schools/:id/requirements', validate({ params: schoolIdParamSchema }), schoolsController.getSchoolRequirements);

/**
 * @swagger
 * /filieres:
 *   get:
 *     summary: List academic filières (filter by school, city, bacTrack)
 *     tags: [Schools]
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         schema: { type: integer }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: bacTrack
 *         schema: { type: string, example: "SM_A" }
 *       - in: query
 *         name: level
 *         schema: { type: string, example: "BAC+5" }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of filières
 */
router.get('/filieres', validate({ query: listFilieresQuerySchema }), schoolsController.getFilieres);

/**
 * @swagger
 * /filieres/{id}:
 *   get:
 *     summary: Get single filière with admission criteria and cutoffs
 *     tags: [Schools]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Filière details
 *       404:
 *         description: Filière not found
 */
router.get('/filieres/:id', validate({ params: filiereIdParamSchema }), schoolsController.getFiliereById);

export default router;
