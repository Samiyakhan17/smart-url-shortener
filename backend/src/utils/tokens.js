import crypto from 'node:crypto';

// A random, hard-to-guess token (64 characters). Used for refresh tokens and API keys.
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// We store only the hash of a token in the database, never the token itself.
// If the database ever leaks, the stolen hashes cannot be used to log in.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Groups the tokens that belong to one login session.
export function generateFamilyId() {
  return crypto.randomUUID();
}