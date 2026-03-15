const app = require('./app');
const { connect } = require('./db');
const { logger } = require('./logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connect();
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB not connected:', err instanceof Error ? err.message : err);
  }
  const host = process.env.HOST ?? '0.0.0.0';
  app.listen(Number(PORT), host, () => {
    console.log(`Server running at http://${host}:${PORT}`);
  });
}

start().catch((err: unknown) => {
  logger.error('Server start failed', err);
  process.exit(1);
});
