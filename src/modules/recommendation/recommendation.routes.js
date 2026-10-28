import express from 'express';
import recommendationController from './recommendation.controller.js';
import authenticate from '../../middlewares/auth.js';
import authorize from '../../middlewares/roles.js';

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /recommendations/generate:
 *   post:
 *     summary: Run the hybrid recommendation pipeline and generate top orientation matches
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Top ranked recommendations with natural-language French explanations
 *       400:
 *         description: Assessment not completed
 */
router.post('/generate', recommendationController.generate);

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Get currently saved orientation recommendations for the authenticated student
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of stored recommendations
 */
router.get('/', recommendationController.getMyRecommendations);

/**
 * @swagger
 * /recommendations/me:
 *   get:
 *     summary: Get currently saved orientation recommendations for the authenticated student
 *     tags: [Recommendations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of stored recommendations
 */
router.get('/me', recommendationController.getMyRecommendations);

export default router;
