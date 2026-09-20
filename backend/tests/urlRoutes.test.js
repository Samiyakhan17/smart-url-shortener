import './setupEnv.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import { FakeUser, FakeToken, resetFakeDb } from './fakeDb.js';
import { FakeUrl, urls, resetFakeUrls } from './fakeUrls.js';

jest.unstable_mockModule('../src/models/User.js', () => ({ User: FakeUser }));
jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({ RefreshToken: FakeToken }));
jest.unstable_mockModule('../src/models/Url.js', () => ({ Url: FakeUrl }));

const { default: app } = await import('../src/app.js');

const U = '/api/v1/urls';
const site = 'https://example.com/a-very-long-page';

// Registers a new user and returns their login token and id.
async function newUser(email = 'sam@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Sam', email, password: 'abcd1234' });
  return { token: res.body.data.accessToken, id: res.body.data.user.id };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeEach(() => {
  resetFakeDb();
  resetFakeUrls();
});

describe('POST /urls', () => {
  it('needs a login', async () => {
    const res = await request(app).post(U).send({ originalUrl: site });
    expect(res.status).toBe(401);
  });

  it('creates a link with a random code', async () => {
    const { token } = await newUser();
    const res = await request(app).post(U).set(auth(token)).send({ originalUrl: site });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shortCode).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(res.body.data.shortUrl).toBe(`http://localhost:4000/${res.body.data.shortCode}`);
    expect(res.body.data.originalUrl).toBe(site);
    expect(res.body.data.state).toBe('active');
    expect(res.body.data.clickCount).toBe(0);
  });

  it('creates a link with a custom alias and an expiry date', async () => {
    const { token } = await newUser();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const res = await request(app)
      .post(U)
      .set(auth(token))
      .send({ originalUrl: site, customAlias: 'Portfolio', expiresAt, title: 'My site' });

    expect(res.status).toBe(201);
    expect(res.body.data.shortCode).toBe('portfolio');
    expect(res.body.data.isCustomAlias).toBe(true);
    expect(res.body.data.expiresAt).toBe(expiresAt);
    expect(res.body.data.title).toBe('My site');
  });

  it('remembers who owns the link', async () => {
    const { token, id } = await newUser();
    await request(app).post(U).set(auth(token)).send({ originalUrl: site });
    expect(urls[0].ownerId).toBe(id);
  });

  it('cannot set protected fields by sneaking them in', async () => {
    const { token, id } = await newUser();
    await request(app).post(U).set(auth(token)).send({
      originalUrl: site,
      ownerId: 'someone-else',
      status: 'blocked',
      clickCount: 9999,
      shortCode: 'hacked',
    });
    expect(urls[0].ownerId).toBe(id);
    expect(urls[0].status).toBe('active');
    expect(urls[0].clickCount).toBe(0);
    expect(urls[0].shortCode).not.toBe('hacked');
  });

  it('says 409 when the alias belongs to someone else', async () => {
    const sam = await newUser('sam@example.com');
    const ana = await newUser('ana@example.com');
    await request(app)
      .post(U)
      .set(auth(sam.token))
      .send({ originalUrl: site, customAlias: 'portfolio' });
    const res = await request(app)
      .post(U)
      .set(auth(ana.token))
      .send({ originalUrl: site, customAlias: 'portfolio' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALIAS_TAKEN');
  });

  it('rejects a reserved alias', async () => {
    const { token } = await newUser();
    const res = await request(app)
      .post(U)
      .set(auth(token))
      .send({ originalUrl: site, customAlias: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALIAS_RESERVED');
    expect(urls).toHaveLength(0);
  });

  it('rejects dangerous or internal destinations', async () => {
    const { token } = await newUser();
    for (const originalUrl of ['javascript:alert(1)', 'http://localhost:3000', 'not a url']) {
      const res = await request(app).post(U).set(auth(token)).send({ originalUrl });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_URL');
    }
    expect(urls).toHaveLength(0);
  });

  it('names the wrong field when the input is invalid', async () => {
    const { token } = await newUser();
    const res = await request(app).post(U).set(auth(token)).send({ title: 'no url here' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field)).toContain('originalUrl');
  });
});