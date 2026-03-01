const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Test database setup: always use an in-memory MongoDB (MongoMemoryServer).
 * The real database is never used during tests.
 */

/** Original MONGODB_URI; restored in afterAll so dev/prod are unaffected. */
const originalMongoUri = process.env.MONGODB_URI;

/** Clear real DB URI before any test code runs so nothing can connect to it. */
process.env.MONGODB_URI = '';

/** In-memory server instance; started in beforeAll, stopped in afterAll. */
let mongod: { getUri: () => string; stop: () => Promise<void> } | null = null;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  const uri = mongod.getUri();
  if (!uri || !uri.includes('127.0.0.1')) {
    throw new Error('Test setup: expected in-memory MongoDB URI from MongoMemoryServer');
  }
  process.env.MONGODB_URI = uri;
}, 60000);

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
  if (originalMongoUri !== undefined) {
    process.env.MONGODB_URI = originalMongoUri;
  } else {
    delete process.env.MONGODB_URI;
  }
});
