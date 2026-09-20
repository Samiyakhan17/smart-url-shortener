import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Turns a password into a scrambled hash. The original password cannot be recovered from it.
export function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

// Checks a typed password against the stored hash.
export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}