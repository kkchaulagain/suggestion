const mongoose = require('mongoose');

/** In test env, only allow in-memory MongoDB URIs (from MongoMemoryServer) to avoid touching real DB. */
function getConnectionUri() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/suggestion';
  const isTest = typeof process.env.JEST_WORKER_ID !== 'undefined';
  if (isTest) {
    if (!uri || uri === 'mongodb://localhost:27017/suggestion' || !uri.includes('127.0.0.1')) {
      throw new Error(
        'Tests must use in-memory MongoDB. Ensure test setup (setupFilesAfterEnv) runs and sets MONGODB_URI.',
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
