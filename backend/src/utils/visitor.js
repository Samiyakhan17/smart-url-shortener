import Bowser from 'bowser';
import { isbot } from 'isbot';
import { env } from '../config/env.js';

const OWN_HOST = new URL(env.BASE_SHORT_URL).hostname;
const MAX_UA_LENGTH = 512; // never spend time parsing absurdly long text
const MAX_REFERRER_LENGTH = 2048;

// Some hosting services (Cloudflare, Vercel, AWS CloudFront) work out the visitor's country
// and pass it to us in one of these headers. We never see or store the IP address ourselves.
const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country'];

const clean = (text) => (text ? String(text).slice(0, 50) : undefined);

// "https://www.linkedin.com/feed/post/123"  ->  "linkedin.com"
// Anything missing, broken, or not a normal web link  ->  "direct"
export function parseReferrerHost(referer, ownHost = OWN_HOST) {
  if (!referer) return 'direct';
  try {
    const url = new URL(String(referer).slice(0, MAX_REFERRER_LENGTH));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return 'direct';

    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    // A click that comes from our own site is not a "source".
    if (!host || host === ownHost.toLowerCase().replace(/^www\./, '')) return 'direct';
    return host.slice(0, 253);
  } catch {
    return 'direct';
  }
}

// Returns a 2-letter country code like "IN", or undefined when we do not know.
export function parseCountry(headers = {}) {
  for (const name of COUNTRY_HEADERS) {
    const value = String(headers[name] ?? '')
      .trim()
      .toUpperCase();
    // "XX" means unknown and "T1" means the Tor network (Cloudflare's codes).
    if (/^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'T1') return value;
  }
  return undefined;
}

// Turns the request headers of one visit into the small, privacy-friendly facts we keep.
export function parseVisitor(headers = {}, { ownHost = OWN_HOST } = {}) {
  const ua = String(headers['user-agent'] ?? '').slice(0, MAX_UA_LENGTH);
  const referrerHost = parseReferrerHost(headers.referer, ownHost);
  const country = parseCountry(headers);

  // No browser text at all is typical for scripts and tools, so we treat it as a bot.
  if (!ua) {
    return { referrerHost, deviceType: 'bot', country, isBot: true };
  }

  let parsed = { browser: {}, os: {}, platform: {} };
  try {
    parsed = Bowser.parse(ua);
  } catch {
    // Unreadable browser text: keep going with empty details.
  }

  const isBot = isbot(ua) || parsed.platform?.type === 'bot';
  const type = parsed.platform?.type;
  const deviceType = isBot
    ? 'bot'
    : type === 'mobile' || type === 'tablet' || type === 'desktop'
      ? type
      : 'other';

  return {
    referrerHost,
    deviceType,
    browser: clean(parsed.browser?.name),
    os: clean(parsed.os?.name),
    country,
    isBot,
  };
}