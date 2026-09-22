import crypto from 'node:crypto';

export function generateApiKey() {
  return `usk_live_${crypto.randomBytes(32).toString('base64url')}`;
}

export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function getApiKeyPrefix(key) {
  return key.slice(0, 8);
}
