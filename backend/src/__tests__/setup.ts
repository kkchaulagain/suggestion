const mongoose = require('mongoose');

/**
 * Test database setup: use Docker MongoDB at localhost:27017 with a dedicated
 * suggestion_test database. Dev/prod data in suggestion is never touched.
 */

const TEST_URI = 'mongodb://localhost:27017/suggestion_test';

/** Original MONGODB_URI; restored in afterAll so dev/prod are unaffected. */
const originalMongoUri = process.env.MONGODB_URI;

beforeAll(() => {
  process.env.MONGODB_URI = TEST_URI;
}, 60000);

afterAll(async () => {
  const conn = mongoose.createConnection(TEST_URI);
  try {
    await conn.asPromise();
    await conn.db.dropDatabase();
  } finally {
    await conn.close();
  }
  if (originalMongoUri !== undefined) {
    process.env.MONGODB_URI = originalMongoUri;
  } else {
    delete process.env.MONGODB_URI;
  }
});
