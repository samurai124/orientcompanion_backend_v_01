import { startRemindersJob } from './reminders.job.js';
import { startSubscriptionExpiryJob } from './subscriptionExpiry.job.js';

export const startCronJobs = () => {
  console.log('⏳ Initializing background cron jobs...');
  startRemindersJob();
  startSubscriptionExpiryJob();
  console.log('✅ Background cron jobs scheduled successfully.');
};

export default startCronJobs;
