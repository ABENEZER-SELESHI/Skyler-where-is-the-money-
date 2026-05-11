import { Router } from 'express';
import { createJob, getJobs, deleteJob } from '../controllers/jobController.js';

const router = Router();

// POST /jobs/create — create and schedule a new job
router.post('/create', createJob);

// GET /jobs — list all jobs
router.get('/', getJobs);

// DELETE /jobs/:id — deactivate a job
router.delete('/:id', deleteJob);

export default router;
