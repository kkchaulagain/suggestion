const request = require('supertest');
const app = require('../app');

describe('Swagger setup', () => {
  it('serves API docs HTML and applies base href (covers serveHtml res.send, lines 529-530)', async () => {
    const res = await request(app).get('/api-docs').expect(200);
    expect(res.text).toContain('swagger-ui-bundle.js');
    expect(res.text).toContain('<base href="/api-docs/">');
  });

  it('serves OpenAPI spec JSON', async () => {
    const res = await request(app).get('/api-docs.json').expect(200);
    expect(res.body).toHaveProperty('openapi', '3.0.0');
    expect(res.body).toHaveProperty('info');
  });
});
