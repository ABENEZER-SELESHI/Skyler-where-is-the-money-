import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import telegramConfig from '../config/telegram.js';

/**
 * In-memory store for pending login states.
 * Key: phoneNumber, Value: { client, phoneCodeHash }
 * This is intentionally ephemeral — sessions are persisted to MongoDB after verify.
 */
const pendingLogins = new Map();

/**
 * Step 1 of auth flow: send login code to the given phone number via Telegram MTProto.
 *
 * @param {string} phoneNumber - E.164 format, e.g. "+2519xxxxxxx"
 * @returns {Promise<void>}
 */
export const startAuth = async (phoneNumber) => {
  console.log(`[Auth] Starting auth for ${phoneNumber}`);

  // Use an empty StringSession — no prior session exists yet
  const session = new StringSession('');
  const client = new TelegramClient(session, telegramConfig.apiId, telegramConfig.apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  // sendCode returns a phoneCodeHash needed for verification
  const { phoneCodeHash } = await client.sendCode(
    { apiId: telegramConfig.apiId, apiHash: telegramConfig.apiHash },
    phoneNumber
  );

  // Store client and hash in memory until verify is called
  pendingLogins.set(phoneNumber, { client, phoneCodeHash });

  console.log(`[Auth] Code sent to ${phoneNumber}`);
};

/**
 * Step 2 of auth flow: verify the code (and optional 2FA password).
 * Returns the session string and Telegram username on success.
 *
 * @param {string} phoneNumber
 * @param {string} code - The code received via Telegram
 * @param {string} [password] - 2FA password if enabled
 * @returns {Promise<{ sessionString: string, username: string }>}
 */
export const verifyAuth = async (phoneNumber, code, password = '') => {
  const pending = pendingLogins.get(phoneNumber);
  if (!pending) {
    throw Object.assign(new Error('No pending login for this phone number. Call /auth/start first.'), { statusCode: 400 });
  }

  const { client, phoneCodeHash } = pending;

  try {
    console.log(`[Auth] Verifying code for ${phoneNumber}`);

    // Sign in with the received code
    await client.invoke(
      new (await import('telegram/tl/functions/auth/index.js')).SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      })
    );
  } catch (err) {
    // Handle 2FA: SESSION_PASSWORD_NEEDED
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      if (!password) {
        throw Object.assign(new Error('2FA password required'), { statusCode: 400 });
      }
      console.log(`[Auth] 2FA required for ${phoneNumber}, checking password`);
      await client.signInWithPassword(
        { apiId: telegramConfig.apiId, apiHash: telegramConfig.apiHash },
        { password: async () => password }
      );
    } else {
      throw err;
    }
  }

  // Retrieve the authenticated user's info
  const me = await client.getMe();
  const username = me.username ? `@${me.username}` : me.phone;

  // Serialize the session to a string for persistent storage
  const sessionString = client.session.save();

  // Clean up the pending login entry
  pendingLogins.delete(phoneNumber);
  await client.disconnect();

  console.log(`[Auth] Successfully authenticated: ${username}`);
  return { sessionString, username };
};
