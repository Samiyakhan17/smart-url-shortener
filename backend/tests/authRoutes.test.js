import './setupEnv.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import { FakeUser, FakeToken, users, resetFakeDb } from './fakeDb.js';

jest.unstable_mockModule('../src/models/User.js', () => ({ User: FakeUser }));
jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({ RefreshToken: FakeToken }));

const { default: app } = await import('../src/app.js');

const sam = { name: 'Sam', email: 'sam@example.com', password: 'abcd1234' };
const A = '/api/v1/auth';

beforeEach(() => resetFakeDb());

describe('POST /register', () => {
  it('creates an account, returns an access token and sets a safe cookie', async () => {
    const res = await request(app).post(`${A}/register`).send(sam);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('sam@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeUndefined(); // only in the cookie
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|abcd1234/);

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^refreshToken=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('cannot make yourself an admin by sending role', async () => {
    const res = await request(app)
      .post(`${A}/register`)
      .send({ ...sam, role: 'admin' });
    expect(res.body.data.user.role).toBe('user');
    expect(users[0].role).toBe('user');
  });

  it('returns 400 for bad input and 409 for a repeated email', async () => {
    const bad = await request(app)
      .post(`${A}/register`)
      .send({ name: 'S', email: 'x', password: '1' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');

    await request(app).post(`${A}/register`).send(sam);
    const again = await request(app).post(`${A}/register`).send(sam);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_TAKEN');
  });
});

describe('POST /login', () => {
  it('logs in with the right password', async () => {
    await request(app).post(`${A}/register`).send(sam);
    const res = await request(app)
      .post(`${A}/login`)
      .send({ email: sam.email, password: sam.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 for a wrong password', async () => {
    await request(app).post(`${A}/register`).send(sam);
    const res = await request(app)
      .post(`${A}/login`)
      .send({ email: sam.email, password: 'wrong-pass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /me', () => {
  it('needs a token, and returns the user when given one', async () => {
    const reg = await request(app).post(`${A}/register`).send(sam);
    expect((await request(app).get(`${A}/me`)).status).toBe(401);

    const res = await request(app)
      .get(`${A}/me`)
      .set('Authorization', `Bearer ${reg.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('sam@example.com');
  });
});

describe('refresh and logout', () => {
  it('refreshes using the cookie, then logout stops it working', async () => {
    const agent = request.agent(app); // an agent remembers cookies, like a browser
    await agent.post(`${A}/register`).send(sam);

    const refreshed = await agent.post(`${A}/refresh`);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeDefined();

    const out = await agent.post(`${A}/logout`);
    expect(out.status).toBe(204);

    const after = await agent.post(`${A}/refresh`);
    expect(after.status).toBe(401);
  });

  it('refresh without a cookie returns 401', async () => {
    const res = await request(app).post(`${A}/refresh`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});