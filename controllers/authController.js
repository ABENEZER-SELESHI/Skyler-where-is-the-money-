import UserSession from '../models/UserSession.js';
import { startAuth, verifyAuth } from '../services/telegramAuthService.js';

/**
 * POST /auth/start
 * Initiates Telegram login by sending a verification code to the phone number.
 *
 * Body: { phoneNumber: string }
 */
export const start = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber is required' });
    }

    await startAuth(phoneNumber);

    res.json({ success: true, message: 'Code sent to your Telegram account' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/verify
 * Completes Telegram login with the received code and optional 2FA password.
 * Saves the session string to MongoDB.
 *
 * Body: { phoneNumber: string, code: string, password?: string }
 */
export const verify = async (req, res, next) => {
  try {
    const { phoneNumber, code, password } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, message: 'phoneNumber and code are required' });
    }

    const { sessionString, username } = await verifyAuth(phoneNumber, code, password);

    // Upsert: update existing session or create a new one
    await UserSession.findOneAndUpdate(
      { phoneNumber },
      { phoneNumber, sessionString, telegramUsername: username },
      { upsert: true, new: true }
    );

    console.log(`[Auth] Session saved for ${username}`);

    res.json({ success: true, username });
  } catch (error) {
    next(error);
  }
};
