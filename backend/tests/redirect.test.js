import './setupEnv.js';
import { jest } from '@jest/globals';
import request from 'supertest';
import { FakeUser, FakeToken, resetFakeDb } from './fakeDb.js';
import { FakeUrl, urls, resetFakeUrls } from './fakeUrls.js';

jest.unstable_mockModule('../src/models/User.js', () => ({ User: FakeUser }));
jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({ RefreshToken: FakeToken }));
jest.unstable_mockModule('../src/models/Url.js', () => ({ Url: FakeUrl }));

const { default: app } = await import('../src/app.js');

const site = 'https://example.com/a-very-long-page';
const HOUR = 60 * 60 * 1000;

// Puts a link straight into the fake database.
const addLink = (fields) =>
  FakeUrl.create({ originalUrl: site, originalHost: 'example.com', ...fields });

// The click is counted just after the redirect, so wait a moment before checking it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

beforeEach(() => {
  resetFakeDb();
  resetFakeUrls();
});

describe('GET /:code with an active link', () => {
  it('redirects to the destination with a 302', async () => {
    await addLink({ shortCode: 'AbC1234' });
    const res = await request(app).get('/AbC1234');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(site);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('needs no login', async () => {
    await addLink({ shortCode: 'portfolio', isCustomAlias: true });
    const res = await request(app).get('/portfolio');
    expect(res.status).toBe(302);
  });

  it('counts each click', async () => {
    await addLink({ shortCode: 'portfolio', isCustomAlias: true });
    await request(app).get('/portfolio');
    await request(app).get('/portfolio');
    await settle();
    expect(urls[0].clickCount).toBe(2);
    expect(urls[0].lastClickedAt).toBeInstanceOf(Date);
  });

  it('finds an alias whatever the letter case', async () => {
    await addLink({ shortCode: 'portfolio', isCustomAlias: true });
    const res = await request(app).get('/PortFolio');
    expect(res.status).toBe(302);
  });

  it('keeps random codes case-sensitive', async () => {
    await addLink({ shortCode: 'AbCdEfG' });
    expect((await request(app).get('/AbCdEfG')).status).toBe(302);
    expect((await request(app).get('/abcdefg')).status).toBe(404);
  });

  it('works end to end: create a link with the API, then open it', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Sam', email: 'sam@example.com', password: 'abcd1234' });
    const created = await request(app)
      .post('/api/v1/urls')
      .set('Authorization', `Bearer ${reg.body.data.accessToken}`)
      .send({ originalUrl: site });

    const res = await request(app).get(`/${created.body.data.shortCode}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(site);
  });
});

describe('links that cannot be opened', () => {
  it('shows a 404 page for a code that does not exist', async () => {
    const res = await request(app).get('/nothere');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('Link not found');
  });

  it('shows a 410 page for an expired link, and does not count a click', async () => {
    await addLink({ shortCode: 'oldlink', expiresAt: new Date(Date.now() - HOUR) });
    const res = await request(app).get('/oldlink');
    expect(res.status).toBe(410);
    expect(res.text).toContain('expired');
    await settle();
    expect(urls[0].clickCount).toBe(0);
  });

  it('still works before the expiry time', async () => {
    await addLink({ shortCode: 'newlink', expiresAt: new Date(Date.now() + HOUR) });
    expect((await request(app).get('/newlink')).status).toBe(302);
  });

  it('shows a 410 page for a disabled link', async () => {
    await addLink({ shortCode: 'offlink', status: 'disabled' });
    const res = await request(app).get('/offlink');
    expect(res.status).toBe(410);
    expect(res.text).toContain('Link unavailable');
  });

  it('shows a 410 page for a blocked link', async () => {
    await addLink({ shortCode: 'badlink', status: 'blocked' });
    const res = await request(app).get('/badlink');
    expect(res.status).toBe(410);
    expect(res.text).toContain('Link removed');
  });

  it('treats a deleted link as not found', async () => {
    await addLink({ shortCode: 'gonelink', deletedAt: new Date() });
    expect((await request(app).get('/gonelink')).status).toBe(404);
  });

  it('treats a link that has not started yet as not found', async () => {
    await addLink({ shortCode: 'soonlink', startsAt: new Date(Date.now() + HOUR) });
    expect((await request(app).get('/soonlink')).status).toBe(404);
  });

  it('never redirects to anything but a web address', async () => {
    await addLink({ shortCode: 'sneaky', originalUrl: 'javascript:alert(1)' });
    const res = await request(app).get('/sneaky');
    expect(res.status).toBe(404);
    expect(res.headers.location).toBeUndefined();
  });

  it('rejects odd paths like /favicon.ico', async () => {
    expect((await request(app).get('/favicon.ico')).status).toBe(404);
    expect((await request(app).get('/a')).status).toBe(404); // too short to be a code
  });

  it('never prints what the visitor typed', async () => {
    const res = await request(app).get('/%3Cscript%3Ealert(1)%3C%2Fscript%3E');
    expect(res.text).not.toContain('alert(1)');
  });
});

describe('the API still works next to the short links', () => {
  it('keeps JSON errors for unknown API routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});