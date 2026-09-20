import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';
import { generateToken, hashToken, generateFamilyId } from '../utils/tokens.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// Only these fields are ever sent to the client. The password hash is never included.
export function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    status: user.status,
    createdAt: user.createdAt,
  };
}

// Creates a new login session: a short access token plus a long-lived refresh token.
async function issueTokens(user, { familyId = generateFamilyId(), userAgent } = {}) {
  const refreshToken = generateToken();
  const stored = await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken), // only the hash is saved
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: userAgent ? userAgent.slice(0, 200) : undefined,
  });
  return { accessToken: signAccessToken(user), refreshToken, refreshTokenId: stored._id };
}

// Used when the email does not exist, so a wrong email takes as long as a wrong password.
let dummyHashPromise;
function getDummyHash() {
  dummyHashPromise ??= hashPassword('dummy-password-for-timing');
  return dummyHashPromise;
}

export async function register({ name, email, password }, meta = {}) {
  const existing = await User.findOne({ email }).select('_id');
  if (existing)
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');

  let user;
  try {
    user = await User.create({ name, email, passwordHash: await hashPassword(password) });
  } catch (err) {
    // Two people registering the same email at the same moment: the database index stops one.
    if (err.code === 11000) {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
    }
    throw err;
  }

  const tokens = await issueTokens(user, meta);
  return { user: publicUser(user), ...tokens };
}

export async function login({ email, password }, meta = {}) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await verifyPassword(
    password,
    user ? user.passwordHash : await getDummyHash(),
  );

  // Same message for "no such email" and "wrong password", so nobody can guess who has an account.
  if (!user || !passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  if (user.status !== 'active') {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account has been suspended.');
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  const tokens = await issueTokens(user, meta);
  return { user: publicUser(user), ...tokens };
}

// Swaps a refresh token for a new access token AND a new refresh token (rotation).
export async function refresh(rawToken, meta = {}) {
  const invalid = () => new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please log in again.');
  if (!rawToken) throw invalid();

  const tokenHash = hashToken(rawToken);

  // Claim the token in one step, so two requests cannot use the same token at once.
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
    { revokedAt: new Date() },
  );

  if (!claimed) {
    // A token that was already used is being used again: it may have been stolen.
    // Log out every session that came from the same login.
    const existing = await RefreshToken.findOne({ tokenHash });
    if (existing?.revokedAt) {
      await RefreshToken.updateMany(
        { familyId: existing.familyId, revokedAt: null },
        { revokedAt: new Date() },
      );
    }
    throw invalid();
  }

  const user = await User.findById(claimed.userId);
  if (!user || user.status !== 'active') throw invalid();

  const tokens = await issueTokens(user, { familyId: claimed.familyId, userAgent: meta.userAgent });
  await RefreshToken.updateOne({ _id: claimed._id }, { replacedBy: tokens.refreshTokenId });
  return { user: publicUser(user), ...tokens };
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { revokedAt: new Date() },
  );
}