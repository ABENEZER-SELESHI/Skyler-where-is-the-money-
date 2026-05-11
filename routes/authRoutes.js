import { Router } from 'express';
import { start, verify } from '../controllers/authController.js';

const router = Router();

// POST /auth/start — send Telegram login code
router.post('/start', start);

// POST /auth/verify — verify code and save session
router.post('/verify', verify);

export default router;
