import './setupEnv.js';
import mongoose from 'mongoose';
import { generateToken, hashToken, generateFamilyId } from '../src/utils/tokens.js';
import { RefreshToken } from '../src/models/RefreshToken.js';

describe('token helpers', () => {
  it('generates a 64 character token that is different every time', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
  });

  it('hashes the same token to the same value, and never returns the token itself', () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toHaveLength(64);
  });

  it('makes a unique family id', () => {
    expect(generateFamilyId()).not.toBe(generateFamilyId());
  });
});

describe('RefreshToken model', () => {
  const base = {
    userId: new mongoose.Types.ObjectId(),
    tokenHash: 'abc',
    familyId: 'fam-1',
  };

  it('is active when not revoked and not expired', () => {
    const t = new RefreshToken({ ...base, expiresAt: new Date(Date.now() + 60000) });
    expect(t.isActive).toBe(true);
  });

  it('is not active when revoked', () => {
    const t = new RefreshToken({
      ...base,
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: new Date(),
    });
    expect(t.isActive).toBe(false);
  });

  it('is not active when expired', () => {
    const t = new RefreshToken({ ...base, expiresAt: new Date(Date.now() - 1000) });
    expect(t.isActive).toBe(false);
  });

  it('requires a token hash', async () => {
    const t = new RefreshToken({ userId: base.userId, familyId: 'f', expiresAt: new Date() });
    await expect(t.validate()).rejects.toThrow(/tokenHash/);
  });
});