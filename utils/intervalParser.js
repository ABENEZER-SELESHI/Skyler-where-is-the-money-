/**
 * Parses human-readable interval strings into milliseconds.
 * Supported formats: 10s, 5m, 1h, 1d
 *
 * @param {string} interval - e.g. "10s", "5m", "1h", "1d"
 * @returns {number} milliseconds
 * @throws {Error} if format is invalid
 */
export const parseInterval = (interval) => {
  const match = interval.trim().match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid interval format: "${interval}". Use formats like 10s, 5m, 1h, 1d`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

/**
 * Converts an interval string to a node-cron expression.
 * node-cron minimum resolution is 1 second.
 *
 * @param {string} interval - e.g. "10s", "5m", "1h", "1d"
 * @returns {string} cron expression
 */
export const intervalToCron = (interval) => {
  const match = interval.trim().match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid interval format: "${interval}"`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return `*/${value} * * * * *`;   // every N seconds
    case 'm':
      return `0 */${value} * * * *`;   // every N minutes
    case 'h':
      return `0 0 */${value} * * *`;   // every N hours
    case 'd':
      return `0 0 0 */${value} * *`;   // every N days
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
};
