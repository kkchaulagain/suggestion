const mongoose = require('mongoose');

/** In test env, only allow the dedicated test DB to avoid touching dev/prod data. */
function getConnectionUri() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/suggestion';
  const isTest = typeof process.env.JEST_WORKER_ID !== 'undefined';
  if (isTest) {
    if (!uri || !uri.includes('suggestion_test')) {
      /* istanbul ignore next -- defensive guard; should never run when test setup is correct */
      throw new Error(
        'Tests must use the test database (URI must contain suggestion_test). Ensure test setup runs and sets MONGODB_URI.',
      );
    }
  }
  return uri;
}

async function connect() {
  const uri = getConnectionUri();
  await mongoose.connect(uri);
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
