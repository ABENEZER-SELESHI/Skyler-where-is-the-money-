import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import connectDB from './config/db.js';
import { loadActiveJobs } from './services/schedulerService.js';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Restore and schedule all active jobs from the database
  await loadActiveJobs();

  // 3. Start the HTTP server
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
};

bootstrap();
