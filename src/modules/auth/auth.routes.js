import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from './auth.controller.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './auth.schema.js';
import validate from '../../middlewares/validate.js';
import authenticate from '../../middlewares/auth.js';

const router = express.Router();

// Rate limiter on /auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      details: null
    }
  }
});

router.use(authLimiter);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new student or counselor
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email, example: "hamza@example.ma" }
 *               password: { type: string, minLength: 8, example: "SecurePass123" }
 *               firstName: { type: string, example: "Hamza" }
 *               lastName: { type: string, example: "El Alami" }
 *               role: { type: string, enum: [STUDENT, COUNSELOR], default: STUDENT }
 *               bacTrack: { type: string, example: "SM_A" }
 *               bacYear: { type: integer, example: 2024 }
 *               region: { type: string, example: "Casablanca-Settat" }
 *               stage: { type: string, enum: [PRE_BAC, POST_BAC, CONCOURS_PREP], default: PRE_BAC }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "hamza@example.ma" }
 *               password: { type: string, example: "SecurePass123" }
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token rotation
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access and refresh tokens generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', validate({ body: logoutSchema }), authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getMe);

export default router;
