import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

// The access token is a short-lived "pass" (15 minutes by default) that proves who you are.
export function signAccessToken(user) {
  return jwt.sign({ role: user.role, plan: user.plan }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id ?? user.id),
    expiresIn: env.JWT_ACCESS_TTL,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token.');
  }
}