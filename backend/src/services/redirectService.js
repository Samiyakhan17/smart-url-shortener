import { Url } from '../models/Url.js';
import { getUrlState } from '../utils/urlState.js';

// Random codes and aliases only use letters, numbers, - and _ (3 to 32 characters).
// Anything else (like /favicon.ico) is rejected straight away, without asking the database.
const CODE_FORMAT = /^[A-Za-z0-9_-]{3,32}$/;

// Only fetch the fields the redirect needs. This keeps the hot path fast.
const FIELDS = 'originalUrl status startsAt expiresAt deletedAt isCustomAlias';

/**
 * Finds a link by its code and says what state it is in.
 * Returns { state, url }. state is: active, expired, disabled, blocked or not_found.
 */
export async function resolveCode(code) {
  if (!CODE_FORMAT.test(code)) return { state: 'not_found' };

  // 1. Exact match (random codes are case-sensitive).
  let url = await Url.findOne({ shortCode: code, deletedAt: null }).select(FIELDS).lean();

  // 2. Aliases are saved in lowercase, so /Portfolio also finds "portfolio".
  const lower = code.toLowerCase();
  if (!url && lower !== code) {
    url = await Url.findOne({ shortCode: lower, isCustomAlias: true, deletedAt: null })
      .select(FIELDS)
      .lean();
  }

  if (!url) return { state: 'not_found' };

  // Extra safety: never redirect anywhere except a normal web address.
  if (!/^https?:\/\//i.test(url.originalUrl)) return { state: 'not_found' };

  const state = getUrlState(url);
  // A link that has not started yet looks like "not found" to visitors.
  if (state === 'scheduled' || state === 'deleted') return { state: 'not_found' };

  return { state, url };
}

// Counts one click. Called after the visitor has already been sent on their way.
export async function recordClick(urlId) {
  await Url.updateOne(
    { _id: urlId },
    { $inc: { clickCount: 1 }, $set: { lastClickedAt: new Date() } },
  );
}