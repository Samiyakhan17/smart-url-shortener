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
const DAY = 24 * 60 * 60 * 1000;

async function newUser(email = 'sam@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Sam', email, password: 'abcd1234' });
  return { token: res.body.data.accessToken };
}

const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

// Creates a link through the API and returns it.
async function makeLink(user, extra = {}) {
  const res = await request(app)
    .post(U)
    .set(auth(user))
    .send({ originalUrl: site, ...extra });
  return res.body.data;
}

let sam;
let ana;

beforeEach(async () => {
  resetFakeDb();
  resetFakeUrls();
  sam = await newUser('sam@example.com');
  ana = await newUser('ana@example.com');
});

describe('GET /urls (list)', () => {
  it('needs a login', async () => {
    expect((await request(app).get(U)).status).toBe(401);
  });

  it('lists only my links, newest first, with page details', async () => {
    const first = await makeLink(sam, { title: 'first' });
    const second = await makeLink(sam, { title: 'second' });
    await makeLink(ana, { title: 'not mine' });

    const res = await request(app).get(U).set(auth(sam));
    expect(res.status).toBe(200);
    expect(res.body.data.map((l) => l.id)).toEqual([second.id, first.id]);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it('splits long lists into pages', async () => {
    for (let i = 0; i < 3; i += 1) await makeLink(sam);
    const page1 = await request(app).get(`${U}?limit=2&page=1`).set(auth(sam));
    const page2 = await request(app).get(`${U}?limit=2&page=2`).set(auth(sam));
    expect(page1.body.data).toHaveLength(2);
    expect(page2.body.data).toHaveLength(1);
    expect(page1.body.meta).toMatchObject({ total: 3, totalPages: 2 });
  });

  it('rejects silly page settings', async () => {
    for (const query of ['limit=0', 'limit=1000', 'page=0', 'page=abc']) {
      const res = await request(app).get(`${U}?${query}`).set(auth(sam));
      expect(res.status).toBe(400);
    }
  });

  it('is empty for a new user', async () => {
    const res = await request(app).get(U).set(auth(ana));
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('GET /urls/:id', () => {
  it('returns one of my links', async () => {
    const link = await makeLink(sam, { title: 'mine' });
    const res = await request(app).get(`${U}/${link.id}`).set(auth(sam));
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('mine');
  });

  it("says 404 for someone else's link, a missing link and a broken id", async () => {
    const link = await makeLink(sam);
    expect((await request(app).get(`${U}/${link.id}`).set(auth(ana))).status).toBe(404);
    expect(
      (
        await request(app)
          .get(`${U}/${'a'.repeat(24)}`)
          .set(auth(sam))
      ).status,
    ).toBe(404);
    expect((await request(app).get(`${U}/not-an-id`).set(auth(sam))).status).toBe(404);
  });
});

describe('PATCH /urls/:id', () => {
  it('changes the title, tags and favourite flag', async () => {
    const link = await makeLink(sam);
    const res = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ title: '  New title ', tags: ['work', 'work', 'cv'], isFavorite: true });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'New title',
      tags: ['work', 'cv'],
      isFavorite: true,
    });
  });

  it('changes the destination, and the short link follows it straight away', async () => {
    const link = await makeLink(sam);
    const res = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ originalUrl: 'HTTPS://New.Example.com/x' });
    expect(res.body.data.originalUrl).toBe('https://new.example.com/x');

    const visit = await request(app).get(`/${link.shortCode}`);
    expect(visit.headers.location).toBe('https://new.example.com/x');
  });

  it('rejects a dangerous new destination and keeps the old one', async () => {
    const link = await makeLink(sam);
    const res = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ originalUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_URL');
    expect(urls[0].originalUrl).toBe(site);
  });

  it('can turn a link off and on again', async () => {
    const link = await makeLink(sam);
    await request(app).patch(`${U}/${link.id}`).set(auth(sam)).send({ status: 'disabled' });
    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(410);

    const on = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ status: 'active' });
    expect(on.body.data.state).toBe('active');
    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(302);
  });

  it('can set and remove an expiry date', async () => {
    const link = await makeLink(sam);
    const soon = new Date(Date.now() + DAY).toISOString();
    const set = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ expiresAt: soon });
    expect(set.body.data.expiresAt).toBe(soon);

    const cleared = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ expiresAt: null });
    expect(cleared.body.data.expiresAt).toBeNull();
  });

  it('can bring an expired link back by giving it a new expiry date', async () => {
    const link = await makeLink(sam);
    urls[0].expiresAt = new Date(Date.now() - 1000); // it has expired
    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(410);

    await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ expiresAt: new Date(Date.now() + DAY).toISOString() });
    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(302);
  });

  it('rejects an expiry date in the past', async () => {
    const link = await makeLink(sam);
    const res = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(sam))
      .send({ expiresAt: '2020-01-01T00:00:00Z' });
    expect(res.status).toBe(400);
  });

  it('never lets the alias or short code change', async () => {
    const link = await makeLink(sam, { customAlias: 'portfolio' });
    for (const body of [{ customAlias: 'other' }, { shortCode: 'other' }]) {
      const res = await request(app).patch(`${U}/${link.id}`).set(auth(sam)).send(body);
      expect(res.status).toBe(400);
    }
    expect(urls[0].shortCode).toBe('portfolio');
  });

  it('does not let an owner block their own link, or change protected fields', async () => {
    const link = await makeLink(sam);
    for (const body of [{ status: 'blocked' }, { clickCount: 5 }, { ownerId: 'x' }]) {
      const res = await request(app).patch(`${U}/${link.id}`).set(auth(sam)).send(body);
      expect(res.status).toBe(400);
    }
  });

  it('rejects an empty change', async () => {
    const link = await makeLink(sam);
    const res = await request(app).patch(`${U}/${link.id}`).set(auth(sam)).send({});
    expect(res.status).toBe(400);
  });

  it("says 404 when trying to change someone else's link", async () => {
    const link = await makeLink(sam);
    const res = await request(app)
      .patch(`${U}/${link.id}`)
      .set(auth(ana))
      .send({ title: 'hijack' });
    expect(res.status).toBe(404);
    expect(urls[0].title).toBeUndefined();
  });

  it('says 403 when an administrator has blocked the link', async () => {
    const link = await makeLink(sam);
    urls[0].status = 'blocked';
    const res = await request(app).patch(`${U}/${link.id}`).set(auth(sam)).send({ title: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('LINK_BLOCKED');
  });
});

describe('DELETE /urls/:id', () => {
  it('deletes the link: it stops working and disappears from the list', async () => {
    const link = await makeLink(sam);
    const res = await request(app).delete(`${U}/${link.id}`).set(auth(sam));
    expect(res.status).toBe(204);

    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(404);
    expect((await request(app).get(`${U}/${link.id}`).set(auth(sam))).status).toBe(404);
    expect((await request(app).get(U).set(auth(sam))).body.data).toEqual([]);
  });

  it("cannot delete someone else's link", async () => {
    const link = await makeLink(sam);
    expect((await request(app).delete(`${U}/${link.id}`).set(auth(ana))).status).toBe(404);
    expect((await request(app).get(`/${link.shortCode}`)).status).toBe(302);
  });

  it('says 404 when deleting twice', async () => {
    const link = await makeLink(sam);
    await request(app).delete(`${U}/${link.id}`).set(auth(sam));
    expect((await request(app).delete(`${U}/${link.id}`).set(auth(sam))).status).toBe(404);
  });

  it('keeps a deleted alias reserved so nobody can take over an old link', async () => {
    const link = await makeLink(sam, { customAlias: 'portfolio' });
    await request(app).delete(`${U}/${link.id}`).set(auth(sam));
    const again = await request(app)
      .post(U)
      .set(auth(ana))
      .send({ originalUrl: site, customAlias: 'portfolio' });
    expect(again.status).toBe(409);
  });

  it('needs a login', async () => {
    const link = await makeLink(sam);
    expect((await request(app).delete(`${U}/${link.id}`)).status).toBe(401);
  });
});