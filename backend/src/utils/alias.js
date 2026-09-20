import { AppError } from './errors.js';
import { isReservedAlias } from '../config/reserved.js';

// 3 to 32 characters. Letters, numbers, - and _ . Must start and end with a letter or number.
const ALIAS_REGEX = /^[a-z0-9][a-z0-9_-]{1,30}[a-z0-9]$/;

/**
 * Cleans up and checks a custom alias. Returns the cleaned alias (lowercase),
 * or throws a 400 error that explains the problem.
 */
export function validateAlias(input) {
  if (typeof input !== 'string') {
    throw new AppError(400, 'INVALID_ALIAS', 'Alias must be text.');
  }

  const alias = input.trim().toLowerCase();

  if (!ALIAS_REGEX.test(alias)) {
    throw new AppError(
      400,
      'INVALID_ALIAS',
      'Alias must be 3-32 characters: letters, numbers, - and _ (it cannot start or end with - or _).',
    );
  }

  if (isReservedAlias(alias)) {
    throw new AppError(
      400,
      'ALIAS_RESERVED',
      'This alias is not available. Please choose another.',
    );
  }

  return alias;
}