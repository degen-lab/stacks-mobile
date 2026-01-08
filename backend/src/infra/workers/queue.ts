import { Queue } from 'bullmq';
import { redis } from '../redis/redisClient';

export const streakQueue = new Queue('streaks', { connection: redis });

export const rewardsQueue = new Queue('rewards', { connection: redis });

export const transactionQueue = new Queue('transactions', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: false, // Keep completed jobs for inspection
    removeOnFail: false, // Keep failed jobs - don't delete them
  },
});

export const submissionsCleanupQueue = new Queue('submissions-cleanup', {
  connection: redis,
});
