import './setupEnv.js';
import { jest } from '@jest/globals';
import crypto from 'node:crypto';

// ---- A tiny fake database, so these tests need no MongoDB at all ----
const users = [];
const tokens = [];

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$gt' in cond) return doc[key] > cond.$gt;
    return (doc[key] ?? null) === cond;
  });
}

const FakeUser = {
  findOne: (filter) => ({ select: async () => users.find((u) => matches(u, filter)) ?? null }),
  findById: async (id) => users.find((u) => u._id === id) ?? null,
  create: async (data) => {
    const user = {
      _id: crypto.randomUUID(),
      role: 'user',
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      ...data,
    };
    users.push(user);
    return user;
  },
  updateOne: async (filter, update) => {
    Object.assign(
      users.find((u) => matches(u, filter)),
      update,
    );
  },
};

const FakeToken = {
  create: async (data) => {
    const t = { _id: crypto.randomUUID(), revokedAt: null, replacedBy: null, ...data };
    tokens.push(t);
    return t;
  },
  findOne: async (filter) => tokens.find((t) => matches(t, filter)) ?? null,
  findOneAndUpdate: async (filter, update) => {
    const t = tokens.find((x) => matches(x, filter));
    if (!t) return null;
    const before = { ...t };
    Object.assign(t, update);
    return before;
  },
  updateOne: async (filter, update) => {
    const t = tokens.find((x) => matches(x, filter));
    if (t) Object.assign(t, update);
  },
  updateMany: async (filter, update) => {
    tokens.filter((x) => matches(x, filter)).forEach((t) => Object.assign(t, update));
  },
};

jest.unstable_mockModule('../src/models/User.js', () => ({ User: FakeUser }));
jest.unstable_mockModule('../src/models/RefreshToken.js', () => ({ RefreshToken: FakeToken }));

const { register, login, refresh, logout } = await import('../src/services/authService.js');
const { verifyAccessToken } = await import('../src/utils/jwt.js');

const sam = { name: 'Sam', email: 'sam@example.com', password: 'abcd1234' };

beforeEach(() => {
  users.length = 0;
  tokens.length = 0;
});

describe('register', () => {
  it('creates a user, stores a hash (not the password) and returns tokens', async () => {
    const result = await register(sam);
    expect(result.user.email).toBe('sam@example.com');
    expect(result.user.passwordHash).toBeUndefined();
    expect(users[0].passwordHash).not.toBe('abcd1234');
    expect(verifyAccessToken(result.accessToken).sub).toBe(result.user.id);
    expect(tokens[0].tokenHash).not.toBe(result.refreshToken); // only the hash is stored
  });

  it('rejects an email that is already registered', async () => {
    await register(sam);
    await expect(register(sam)).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_TAKEN' });
  });
});

describe('login', () => {
  it('logs in with the right password', async () => {
    await register(sam);
    const result = await login({ email: sam.email, password: sam.password });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await register(sam);
    const wrongPassword = await login({ email: sam.email, password: 'wrong-pass1' }).catch(
      (e) => e,
    );
    const unknownEmail = await login({ email: 'no@example.com', password: 'abcd1234' }).catch(
      (e) => e,
    );
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.message).toBe(unknownEmail.message);
  });

  it('blocks suspended accounts', async () => {
    await register(sam);
    users[0].status = 'suspended';
    await expect(login({ email: sam.email, password: sam.password })).rejects.toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_SUSPENDED',
    });
  });
});

describe('refresh', () => {
  it('swaps a refresh token for a new pair, and the old token stops working', async () => {
    const first = await register(sam);
    const second = await refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    await expect(refresh(first.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('logs out the whole session if an old token is used again', async () => {
    const first = await register(sam);
    const second = await refresh(first.refreshToken);
    await refresh(first.refreshToken).catch(() => {}); // someone replays the old token
    await expect(refresh(second.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects an expired refresh token', async () => {
    const first = await register(sam);
    tokens[0].expiresAt = new Date(Date.now() - 1000);
    await expect(refresh(first.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a missing or made-up token', async () => {
    await expect(refresh(undefined)).rejects.toMatchObject({ statusCode: 401 });
    await expect(refresh('made-up-token')).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('logout', () => {
  it('makes the refresh token unusable', async () => {
    const first = await register(sam);
    await logout(first.refreshToken);
    await expect(refresh(first.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('does nothing (and does not crash) without a token', async () => {
    await expect(logout(undefined)).resolves.toBeUndefined();
  });
});