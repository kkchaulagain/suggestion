const app = require('./app');
const { connect } = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connect();
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB not connected:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
