import Job from '../models/Job.js';
import UserSession from '../models/UserSession.js';
import { scheduleJob, stopJob } from '../services/schedulerService.js';
import { intervalToCron } from '../utils/intervalParser.js';

/**
 * POST /jobs/create
 * Creates a new recurring messaging job and schedules it immediately.
 *
 * Body: { senderUsername, receiverUsername, interval, message }
 */
export const createJob = async (req, res, next) => {
  try {
    const { senderUsername, receiverUsername, interval, message } = req.body;

    // Validate required fields
    if (!senderUsername || !receiverUsername || !interval || !message) {
      return res.status(400).json({
        success: false,
        message: 'senderUsername, receiverUsername, interval, and message are all required',
      });
    }

    // Validate interval format before saving
    try {
      intervalToCron(interval);
    } catch {
      return res.status(400).json({ success: false, message: `Invalid interval: "${interval}". Use formats like 10s, 5m, 1h, 1d` });
    }

    // Look up the sender's saved session
    const session = await UserSession.findOne({ telegramUsername: senderUsername });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: `No authenticated session found for ${senderUsername}. Please authenticate first.`,
      });
    }

    // Persist the job
    const job = await Job.create({
      senderUsername,
      receiverUsername,
      interval,
      message,
      sessionId: session._id,
      active: true,
    });

    // Register with the scheduler immediately
    await scheduleJob(job);

    console.log(`[Jobs] Created job ${job._id}: ${senderUsername} → ${receiverUsername} every ${interval}`);

    res.status(201).json({ success: true, message: 'Job created and scheduled', jobId: job._id });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /jobs
 * Returns all jobs (active and inactive).
 */
export const getJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /jobs/:id
 * Deactivates a job and stops its cron task.
 */
export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Mark as inactive in DB
    job.active = false;
    await job.save();

    // Stop the in-memory cron task
    stopJob(id);

    console.log(`[Jobs] Deactivated job ${id}`);

    res.json({ success: true, message: 'Job deactivated' });
  } catch (error) {
    next(error);
  }
};
