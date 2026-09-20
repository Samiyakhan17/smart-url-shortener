import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function notFound(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again later.';
  let details = [];

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input.';
    details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large.';
  }

  if (status >= 500) {
    (req.log || console).error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    success: false,
    error: { code, message, details },
    requestId: req.id,
  });
}
