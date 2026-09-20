import { env } from '../config/env.js';
import { AppError } from './errors.js';

const MAX_URL_LENGTH = 2048;
const OWN_HOST = new URL(env.BASE_SHORT_URL).hostname;

const invalid = (message) => new AppError(400, 'INVALID_URL', message);

// Is this an IPv4 address that points to a private, internal or reserved network?
function isPrivateIPv4(host) {
  const parts = host.split('.').map(Number);
  const [a, b] = parts;
  return (
    a === 0 || // 0.0.0.0
    a === 10 || // private
    a === 127 || // this computer
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local (includes cloud metadata 169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    a >= 224 // multicast and reserved
  );
}

/**
 * Checks a destination URL and cleans it up.
 * Returns { href, host } or throws a 400 INVALID_URL error.
 */
export function parseDestinationUrl(input, { ownHost = OWN_HOST } = {}) {
  if (typeof input !== 'string') throw invalid('Enter a valid URL.');

  const text = input.trim();
  if (!text) throw invalid('Enter a URL.');
  if (text.length > MAX_URL_LENGTH) {
    throw invalid(`URL is too long (maximum ${MAX_URL_LENGTH} characters).`);
  }

  let url;
  try {
    url = new URL(text);
  } catch {
    throw invalid('Enter a full URL that starts with http:// or https://');
  }

  // Blocks javascript:, data:, file:, ftp: and everything else that is not a normal web link.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw invalid('Only http:// and https:// links are allowed.');
  }

  if (url.username || url.password) {
    throw invalid('Links with a username or password are not allowed.');
  }

  const host = url.hostname; // already lowercase; odd IP formats are turned into normal ones

  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw invalid('Links to this computer are not allowed.');
  }

  if (host.startsWith('[')) {
    throw invalid('IPv6 address links are not allowed. Use a domain name.');
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && isPrivateIPv4(host)) {
    throw invalid('Links to private or internal addresses are not allowed.');
  }

  if (host === ownHost) {
    throw invalid('You cannot shorten a link that points back to this service.');
  }

  return { href: url.href, host };
}