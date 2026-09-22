import './setupEnv.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import { FakeUser, FakeToken, resetFakeDb } from './fakeDb.js';
import { FakeUrl, resetFakeUrls } from './fakeUrls.js';

const logs = [];
const AuditLog = {
  create: async (data) => {
    const entry = { ...data, createdAt: new Date() };
    logs.push(entry);
    return entry;
  },
  find: (filter) => ({
    sort: () => ({
      lean: async () => logs.filter((l) => String(l.urlId) === String(filter.urlId)).reverse(),
    }),
  }),
};

jest.unstable_mockModule('../src/models/User.js', () => ({ User: FakeUser }));
jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({ RefreshToken: FakeToken }));
jest.unstable_mockModule('../src/models/Url.js', () => ({ Url: FakeUrl }));
jest.unstable_mockModule('../src/models/AuditLog.js', () => ({
  AuditLog: { create: async () => ({}) },
}));

jest.unstable_mockModule('../src/models/AuditLog.js', () => ({ AuditLog }));

const { default: app } = await import('../src/app.js');

const U = '/api/v1/urls';
const site = 'https://example.com/a-very-long-page';

async function newUser(email = 'sam@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Sam', email, password: 'abcd1234' });
  return { token: res.body.data.accessToken };
}
const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

let sam;
beforeEach(async () => {
  resetFakeDb();
  resetFakeUrls();
  logs.length = 0;
  sam = await newUser();
});

describe('GET /urls/:id/history', () => {
  it('records a change when the destination is edited', async () => {
    const created = await request(app).post(U).set(auth(sam)).send({ originalUrl: site });
    await request(app)
      .patch(`${U}/${created.body.data.id}`)
      .set(auth(sam))
      .send({ originalUrl: 'https://new-example.com' });

    const res = await request(app).get(`${U}/${created.body.data.id}/history`).set(auth(sam));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      action: 'destination_changed',
      before: site,
      after: 'https://new-example.com/',
    });
  });

  it('records nothing when the destination does not change', async () => {
    const created = await request(app).post(U).set(auth(sam)).send({ originalUrl: site });
    await request(app).patch(`${U}/${created.body.data.id}`).set(auth(sam)).send({ title: 'x' });

    const res = await request(app).get(`${U}/${created.body.data.id}/history`).set(auth(sam));
    expect(res.body.data).toHaveLength(0);
  });
});