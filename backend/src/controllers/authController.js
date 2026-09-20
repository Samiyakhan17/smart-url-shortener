import * as authService from '../services/authService.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const COOKIE_NAME = 'refreshToken';
const COOKIE_PATH = '/api/v1/auth';

// The refresh token lives in a cookie that JavaScript on the page cannot read (httpOnly).
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
  };
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

const meta = (req) => ({ userAgent: req.get('user-agent') });

function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(COOKIE_NAME, refreshToken, {
    ...cookieOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
  // The refresh token goes only in the cookie, never in the response body.
  res.status(status).json({ success: true, data: { user, accessToken } });
}

export async function register(req, res) {
  const result = await authService.register(req.body, meta(req));
  sendSession(res, 201, result);
}

export async function login(req, res) {
  const result = await authService.login(req.body, meta(req));
  sendSession(res, 200, result);
}

export async function refresh(req, res) {
  try {
    const result = await authService.refresh(req.cookies?.[COOKIE_NAME], meta(req));
    sendSession(res, 200, result);
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[COOKIE_NAME]);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  }
  res.json({ success: true, data: { user: authService.publicUser(user) } });
}