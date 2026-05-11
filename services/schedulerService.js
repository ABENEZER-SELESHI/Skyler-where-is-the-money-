import cron from 'node-cron';
import Job from '../models/Job.js';
import UserSession from '../models/UserSession.js';
import { sendMessage } from './telegramMessageService.js';
import { intervalToCron } from '../utils/intervalParser.js';

/**
 * In-memory registry of active cron tasks.
 * Key: job._id.toString(), Value: node-cron ScheduledTask
 */
const activeTasks = new Map();

/**
 * Schedules a single job using node-cron.
 * Fetches the sender's session from DB and sends the message on each tick.
 *
 * @param {object} job - Mongoose Job document
 */
export const scheduleJob = async (job) => {
  const jobId = job._id.toString();

  // Avoid duplicate scheduling
  if (activeTasks.has(jobId)) {
    console.log(`[Scheduler] Job ${jobId} is already scheduled, skipping`);
    return;
  }

  let cronExpression;
  try {
    cronExpression = intervalToCron(job.interval);
  } catch (err) {
    console.error(`[Scheduler] Invalid interval for job ${jobId}: ${err.message}`);
    return;
  }

  console.log(`[Scheduler] Scheduling job ${jobId} (${job.senderUsername} → ${job.receiverUsername}) every ${job.interval}`);

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Executing job ${jobId}`);
    try {
      // Re-fetch session each tick in case it was updated
      const session = await UserSession.findById(job.sessionId);
      if (!session) {
        console.error(`[Scheduler] Session not found for job ${jobId}, stopping task`);
        stopJob(jobId);
        return;
      }

      await sendMessage(session.sessionString, job.receiverUsername, job.message);
    } catch (error) {
      console.error(`[Scheduler] Job ${jobId} failed: ${error.message}`);
    }
  });

  activeTasks.set(jobId, task);
};

/**
 * Stops and removes a scheduled job from the in-memory registry.
 *
 * @param {string} jobId - Job document _id as string
 */
export const stopJob = (jobId) => {
  const task = activeTasks.get(jobId);
  if (task) {
    task.stop();
    activeTasks.delete(jobId);
    console.log(`[Scheduler] Job ${jobId} stopped`);
  }
};

/**
 * Loads all active jobs from MongoDB and schedules them.
 * Called once on server startup to restore jobs after a restart.
 */
export const loadActiveJobs = async () => {
  console.log('[Scheduler] Loading active jobs from database...');
  try {
    const jobs = await Job.find({ active: true });
    console.log(`[Scheduler] Found ${jobs.length} active job(s)`);

    for (const job of jobs) {
      await scheduleJob(job);
    }
  } catch (error) {
    console.error(`[Scheduler] Failed to load jobs: ${error.message}`);
  }
};
