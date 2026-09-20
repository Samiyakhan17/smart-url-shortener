import './setupEnv.js';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';
import { AppError } from '../src/utils/errors.js';

describe('password helpers', () => {
  it('hashes a password so the original is not stored', async () => {
    const hash = await hashPassword('abcd1234');
    expect(hash).not.toBe('abcd1234');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('accepts the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('abcd1234');
    expect(await verifyPassword('abcd1234', hash)).toBe(true);
    expect(await verifyPassword('wrong-password1', hash)).toBe(false);
  });

  it('gives a different hash each time for the same password', async () => {
    const a = await hashPassword('abcd1234');
    const b = await hashPassword('abcd1234');
    expect(a).not.toBe(b);
  });
});

describe('access token helpers', () => {
  const user = { _id: '66f1c0f3b7d4a1a2b3c4d5aa', role: 'user', plan: 'free' };

  it('signs a token and reads back the same details', () => {
    const payload = verifyAccessToken(signAccessToken(user));
    expect(payload.sub).toBe(user._id);
    expect(payload.role).toBe('user');
    expect(payload.plan).toBe('free');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('rejects a token that was changed', () => {
    const token = signAccessToken(user);
    const tampered = token.slice(0, -3) + 'abc';
    expect(() => verifyAccessToken(tampered)).toThrow(AppError);
  });

  it('rejects a token signed with a different secret', () => {
    const fake = jwt.sign({ role: 'admin' }, 'some-other-secret-some-other-secret', {
      subject: 'x',
    });
    expect(() => verifyAccessToken(fake)).toThrow(AppError);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ role: 'user' }, process.env.JWT_ACCESS_SECRET, {
      subject: 'x',
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow(/Invalid or expired/);
  });

  it('rejects garbage', () => {
    expect(() => verifyAccessToken('not-a-token')).toThrow(AppError);
  });
});