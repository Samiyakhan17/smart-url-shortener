import './setupEnv.js';
import request from 'supertest';
import app from '../src/app.js';

describe('health route', () => {
  it('reports degraded (503) when the database is not connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.db).toBe('disconnected');
  });

  it('sets a request id header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('error handling', () => {
  it('returns a clean 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid JSON bodies', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{ bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});
