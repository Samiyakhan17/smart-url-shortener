import './setupEnv.js';
import express from 'express';
import request from 'supertest';
import { requireAuth, requireRole } from '../src/middleware/authMiddleware.js';
import { validate } from '../src/middleware/validateMiddleware.js';
import { errorHandler } from '../src/middleware/errorMiddleware.js';
import { registerSchema } from '../src/validators/authSchemas.js';
import { signAccessToken } from '../src/utils/jwt.js';

// A tiny app with a few test routes, just for these tests.
const app = express();
app.use(express.json());
app.get('/private', requireAuth, (req, res) => res.json({ user: req.user }));
app.get('/admin', requireAuth, requireRole('admin'), (_req, res) => res.json({ ok: true }));
app.post('/echo', validate(registerSchema), (req, res) => res.json(req.body));
app.use(errorHandler);

const userToken = signAccessToken({ _id: 'u1', role: 'user', plan: 'free' });
const adminToken = signAccessToken({ _id: 'a1', role: 'admin', plan: 'pro' });

describe('requireAuth', () => {
  it('blocks requests with no token', async () => {
    const res = await request(app).get('/private');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('blocks a bad token', async () => {
    const res = await request(app).get('/private').set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });

  it('blocks a header that is not in the Bearer format', async () => {
    const res = await request(app).get('/private').set('Authorization', userToken);
    expect(res.status).toBe(401);
  });

  it('lets a valid token through and fills in req.user', async () => {
    const res = await request(app).get('/private').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'u1', role: 'user', plan: 'free' });
  });
});

describe('requireRole', () => {
  it('blocks a normal user from an admin route (403)', async () => {
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('lets an admin in', async () => {
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('validate', () => {
  it('returns 400 with the names of the wrong fields', async () => {
    const res = await request(app).post('/echo').send({ name: 'S', email: 'nope', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('returns 400 when there is no body at all', async () => {
    const res = await request(app).post('/echo');
    expect(res.status).toBe(400);
  });

  it('passes cleaned data on and drops extra fields like role', async () => {
    const res = await request(app)
      .post('/echo')
      .send({ name: ' Sam ', email: 'SAM@example.com', password: 'abcd1234', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Sam', email: 'sam@example.com', password: 'abcd1234' });
  });
});