const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  }
}, 30000);

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});
