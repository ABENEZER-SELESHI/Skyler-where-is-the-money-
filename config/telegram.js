/**
 * Telegram API credentials loaded from environment variables.
 * Obtain API_ID and API_HASH from https://my.telegram.org
 */
const telegramConfig = {
  apiId: parseInt(process.env.API_ID, 10),
  apiHash: process.env.API_HASH,
};

export default telegramConfig;
