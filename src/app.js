import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import env from './config/env.js';
import swaggerSpec from './config/swagger.js';
import errorHandler from './middlewares/error.js';
import { notFound } from './utils/errors.js';
import { sendSuccess } from './utils/response.js';

import authRoutes from './modules/auth/auth.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import schoolsRoutes from './modules/schools/schools.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import assessmentRoutes from './modules/assessment/assessment.routes.js';
import recommendationRoutes from './modules/recommendation/recommendation.routes.js';
import chatbotRoutes from './modules/chatbot/chatbot.routes.js';
import gradePlannerRoutes from './modules/gradePlanner/gradePlanner.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes.js';
import concoursRoutes from './modules/concours/concours.routes.js';
import mentorshipRoutes from './modules/mentorship/mentorship.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';

const app = express();

// Security and HTTP headers
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true
}));

// HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Health check endpoints
 */
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, {
    status: 'UP',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Central API Router
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  return sendSuccess(res, {
    name: 'OrientCompanion API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Mount module routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/students', studentsRoutes);
apiRouter.use('/', schoolsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/assessment', assessmentRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/chatbot', chatbotRoutes);
apiRouter.use('/grade-planner', gradePlannerRoutes);
apiRouter.use('/applications', applicationsRoutes);
apiRouter.use('/', subscriptionsRoutes);
apiRouter.use('/', concoursRoutes);
apiRouter.use('/', mentorshipRoutes);
apiRouter.use('/notifications', notificationsRoutes);

app.use('/api/v1', apiRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Central Error Handler
app.use(errorHandler);

export default app;
