import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';
import { startCronJobs } from './jobs/index.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 OrientCompanion API running on port ${PORT} [${env.NODE_ENV}]`);
  console.log(`📚 Swagger documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`🩺 Health check available at http://localhost:${PORT}/health`);

  // Start background cron jobs in non-test environments
  if (env.NODE_ENV !== 'test') {
    startCronJobs();
  }
});

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ Database connections closed. Process terminating.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during database disconnect:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
