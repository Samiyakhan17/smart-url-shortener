import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const response = (message) => ({
  success: false,
  error: { code: 'RATE_LIMITED', message, details: [] },
});

// Keep rate limiting optional for local development and deterministic tests.
const skipWhenDisabled = () =>
  process.env.NODE_ENV === 'test' || process.env.RATE_LIMIT_ENABLED === 'false';

const userOrIp = (req) => req.user?.id ?? ipKeyGenerator(req.ip);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhenDisabled,
  message: response('Too many attempts. Try again later.'),
});

export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhenDisabled,
  keyGenerator: userOrIp,
  message: response('Too many links created. Slow down.'),
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhenDisabled,
  keyGenerator: userOrIp,
  message: response('Too many API requests. Try again later.'),
});

export const redirectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhenDisabled,
  message: response('Too many redirects. Try again later.'),
});
