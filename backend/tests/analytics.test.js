import './setupEnv.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import { FakeUser, FakeToken, resetFakeDb } from './fakeDb.js';
import { FakeUrl, resetFakeUrls } from './fakeUrls.js';

const aggregate = jest.fn();
const countDocuments = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  User: FakeUser,
}));

jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({
  RefreshToken: FakeToken,
}));

jest.unstable_mockModule('../src/models/Url.js', () => ({
  Url: FakeUrl,
}));

jest.unstable_mockModule('../src/models/Click.js', () => ({
  Click: { aggregate, countDocuments },
}));

const { default: app } = await import('../src/app.js');

const U = '/api/v1/urls';
const site = 'https://example.com/page';

async function newUser(email = 'sam@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Sam', email, password: 'abcd1234' });

  return { token: res.body.data.accessToken };
}

const auth = (user) => ({
  Authorization: `Bearer ${user.token}`,
});

async function makeLink(user) {
  const res = await request(app)
    .post(U)
    .set(auth(user))
    .send({ originalUrl: site });

  return res.body.data;
}

let sam;
let ana;

beforeEach(async () => {
  resetFakeDb();
  resetFakeUrls();
  aggregate.mockReset();
  countDocuments.mockReset();

  sam = await newUser('sam@example.com');
  ana = await newUser('ana@example.com');
});

describe('GET /urls/:id/analytics', () => {
  it('needs a login', async () => {
    const link = await makeLink(sam);

    const res = await request(app).get(`${U}/${link.id}/analytics`);

    expect(res.status).toBe(401);
  });

  it('returns statistics for my link', async () => {
    const link = await makeLink(sam);

    aggregate.mockResolvedValue([
      {
        total: [{ count: 3 }],
        lastClickedAt: [{ ts: new Date('2026-09-21T10:00:00.000Z') }],
        referrers: [{ name: 'linkedin.com', clicks: 2 }],
        devices: [{ name: 'mobile', clicks: 2 }],
        browsers: [{ name: 'Chrome', clicks: 3 }],
        operatingSystems: [{ name: 'Android', clicks: 2 }],
        countries: [{ name: 'IN', clicks: 3 }],
      },
    ]);

    const res = await request(app)
      .get(`${U}/${link.id}/analytics`)
      .set(auth(sam));

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        totalClicks: 3,
        lastClickedAt: '2026-09-21T10:00:00.000Z',
        referrers: [{ name: 'linkedin.com', clicks: 2 }],
        devices: [{ name: 'mobile', clicks: 2 }],
        browsers: [{ name: 'Chrome', clicks: 3 }],
        operatingSystems: [{ name: 'Android', clicks: 2 }],
        countries: [{ name: 'IN', clicks: 3 }],
      },
    });
  });

  it("doesn't expose someone else's analytics", async () => {
    const link = await makeLink(sam);

    const res = await request(app)
      .get(`${U}/${link.id}/analytics`)
      .set(auth(ana));

    expect(res.status).toBe(404);
    expect(aggregate).not.toHaveBeenCalled();
  });

  it('returns empty statistics when there are no clicks', async () => {
    const link = await makeLink(sam);

    aggregate.mockResolvedValue([
      {
        total: [],
        lastClickedAt: [],
        referrers: [],
        devices: [],
        browsers: [],
        operatingSystems: [],
        countries: [],
      },
    ]);

    const res = await request(app)
      .get(`${U}/${link.id}/analytics`)
      .set(auth(sam));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalClicks: 0,
      lastClickedAt: null,
      referrers: [],
      devices: [],
      browsers: [],
      operatingSystems: [],
      countries: [],
    });
  });
});
describe('GET /analytics/summary', () => {
  it('requires a login', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary');

    expect(res.status).toBe(401);
  });

  it('returns dashboard click totals', async () => {
    const link = await makeLink(sam);

    countDocuments
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(22);

    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set(auth(sam));
    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        totalClicks: link.clickCount ?? 0,
        today: 4,
        last7Days: 15,
        last30Days: 22,
      },
    });

    expect(countDocuments).toHaveBeenCalledTimes(3);
  });
});