import { ApiKey } from '../models/ApiKey.js';
import { AppError } from '../utils/errors.js';
import { generateApiKey, getApiKeyPrefix, hashApiKey } from '../utils/apiKeys.js';

export function publicApiKey(key) {
  return {
    id: String(key._id),
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    expiresAt: key.expiresAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
  };
}

export async function createApiKey(userId, input) {
  const secret = generateApiKey();
  const key = await ApiKey.create({
    userId,
    name: input.name,
    expiresAt: input.expiresAt ?? null,
    prefix: getApiKeyPrefix(secret),
    keyHash: hashApiKey(secret),
  });
  return { ...publicApiKey(key), key: secret };
}

export async function listApiKeys(userId) {
  const keys = await ApiKey.find({ userId }).sort({ createdAt: -1 });
  return keys.map(publicApiKey);
}

export async function revokeApiKey(userId, id) {
  const key = await ApiKey.findOne({
    _id: id,
    userId,
  });

  if (!key) {
    throw new AppError(404, 'NOT_FOUND', 'API key not found.');
  }

  if (key.revokedAt) {
    throw new AppError(
      409,
      'ALREADY_REVOKED',
      'API key has already been revoked.'
    );
  }

  key.revokedAt = new Date();
  await key.save();
}

export async function authenticateApiKey(secret) {
  if (!secret?.startsWith('usk_live_')) return null;
  const key = await ApiKey.findOne({ keyHash: hashApiKey(secret), revokedAt: null })
    .select('+keyHash')
    .populate('userId');
  if (!key || key.expiresAt?.getTime() <= Date.now() || key.userId?.status !== 'active') return null;

  // This is deliberately not awaited by callers; a stats write must not delay an API request.
  ApiKey.updateOne({ _id: key._id }, { lastUsedAt: new Date() }).catch(() => {});
  return { id: String(key.userId._id), role: key.userId.role, plan: key.userId.plan, keyId: String(key._id) };
}
