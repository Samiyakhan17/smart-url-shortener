import './setupEnv.js';
import { User } from '../src/models/User.js';
import { Url } from '../src/models/Url.js';

const base = {
  shortCode: 'abc1234',
  originalUrl: 'https://example.com',
  originalHost: 'example.com',
};

describe('Url model state', () => {
  it('is active by default', () => {
    expect(new Url(base).state).toBe('active');
  });

  it('is expired when expiresAt is in the past', () => {
    expect(new Url({ ...base, expiresAt: new Date(Date.now() - 1000) }).state).toBe('expired');
  });

  it('is disabled or blocked based on status', () => {
    expect(new Url({ ...base, status: 'disabled' }).state).toBe('disabled');
    expect(new Url({ ...base, status: 'blocked' }).state).toBe('blocked');
  });

  it('is deleted when deletedAt is set', () => {
    expect(new Url({ ...base, deletedAt: new Date() }).state).toBe('deleted');
  });

  it('is scheduled when startsAt is in the future', () => {
    expect(new Url({ ...base, startsAt: new Date(Date.now() + 100000) }).state).toBe('scheduled');
  });

  it('requires a destination URL', async () => {
    await expect(new Url({ shortCode: 'x1' }).validate()).rejects.toThrow(/originalUrl/);
  });
});

describe('User model', () => {
  it('lowercases email and applies defaults', () => {
    const u = new User({ name: 'Sam', email: 'SAM@Example.com', passwordHash: 'hash' });
    expect(u.email).toBe('sam@example.com');
    expect(u.role).toBe('user');
    expect(u.plan).toBe('free');
    expect(u.status).toBe('active');
  });

  it('never exposes passwordHash in JSON', () => {
    const u = new User({ name: 'Sam', email: 'sam@example.com', passwordHash: 'secret' });
    expect(u.toJSON().passwordHash).toBeUndefined();
  });
});
