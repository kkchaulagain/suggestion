const request = require('supertest');
const app = require('../app');

describe('App routes', () => {
  it('returns the backend hello payload on /', async () => {
    const res = await request(app).get('/').expect(200);

    expect(res.body).toEqual({ message: 'Hello from the backend', ok: true });
  });

  it('returns ok on /health', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });
});
