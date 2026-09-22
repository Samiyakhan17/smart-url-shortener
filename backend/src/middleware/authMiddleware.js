import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/errors.js';
import { authenticateApiKey } from '../services/apiKeyService.js';

// Put this in front of any route that needs a logged-in user.
// It reads the "Authorization: Bearer <token>" header and fills in req.user.
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const payload = verifyAccessToken(header.slice(7).trim());
    req.user = { id: payload.sub, role: payload.role, plan: payload.plan };
    req.auth = { method: 'jwt' };
    return next();
  }
  const user = await authenticateApiKey(req.get('X-API-Key'));
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  req.user = user;
  req.auth = { method: 'apiKey', keyId: user.keyId };
  return next();
}

export function requireJwtAuth(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) return requireAuth(req, res, next);
  throw new AppError(401, 'UNAUTHORIZED', 'Please log in with an access token to continue.');
}

// Use after requireAuth. Example: requireRole('admin') lets only admins through.
export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to do this.');
    }
    next();
  };
}
