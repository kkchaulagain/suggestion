/**
 * Application logger. No-ops in test so expected error paths don't clutter test output.
 * In development/production, logs to console.
 */
const isTest = process.env.NODE_ENV === 'test';

export const logger = {
  error(message: string, err?: unknown): void {
    if (!isTest) {
      if (err !== undefined) {
        console.error(message, err);
      } else {
        console.error(message);
      }
    }
  },
};
