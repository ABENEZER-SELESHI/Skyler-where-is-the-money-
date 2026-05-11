import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import telegramConfig from '../config/telegram.js';

/**
 * Sends a Telegram message from an authenticated user account using GramJS MTProto.
 * Creates a client from the saved session string, sends the message, then disconnects.
 *
 * @param {string} sessionString - Serialized GramJS session from MongoDB
 * @param {string} receiver - Telegram username (e.g. "@bob") or phone number
 * @param {string} message - Message text to send
 * @returns {Promise<void>}
 */
export const sendMessage = async (sessionString, receiver, message) => {
  console.log(`[Messenger] Sending message to ${receiver}`);

  // Restore the session from the saved string
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, telegramConfig.apiId, telegramConfig.apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.connect();

    // sendMessage resolves the receiver by username or phone automatically
    await client.sendMessage(receiver, { message });

    console.log(`[Messenger] Message delivered to ${receiver}`);
  } catch (error) {
    console.error(`[Messenger] Failed to send message to ${receiver}: ${error.message}`);
    throw error;
  } finally {
    // Always disconnect to free up the connection
    await client.disconnect();
  }
};
