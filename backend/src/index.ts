const app = require('./app');
const { connect } = require('./db');
const { logger } = require('./logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connect();
    logger.info('MongoDB connected');
  } catch (err) {
    logger.warn('MongoDB not connected', { message: err instanceof Error ? err.message : err });
  }
  const host = process.env.HOST ?? '0.0.0.0';
  app.listen(Number(PORT), host, () => {
    logger.info('Server running', { host, port: PORT });
  });
}

start().catch((err: unknown) => {
  logger.error('Server start failed', err);
  process.exit(1);
});
