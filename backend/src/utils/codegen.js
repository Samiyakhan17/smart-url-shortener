import { customAlphabet } from 'nanoid';
import { isReservedAlias } from '../config/reserved.js';

// Base62: A-Z, a-z, 0-9. 7 characters gives about 3.5 trillion possible codes.
export const CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const CODE_LENGTH = 7;

const nano = customAlphabet(CODE_ALPHABET, CODE_LENGTH);

// Makes a random short code such as "aZ7kP2q". It uses a secure random source, so codes
// cannot be guessed in order. (The database still checks that a code is unique.)
export function generateShortCode() {
  let code = nano();
  while (isReservedAlias(code)) code = nano(); // practically never happens
  return code;
}