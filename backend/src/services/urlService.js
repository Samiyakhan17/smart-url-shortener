import { Url } from '../models/Url.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { parseDestinationUrl } from '../utils/urlSafety.js';
import { validateAlias } from '../utils/alias.js';
import { generateShortCode } from '../utils/codegen.js';
import { getUrlState } from '../utils/urlState.js';

const MAX_CODE_ATTEMPTS = 5;

// The shape of a link that we send to the client.
export function publicUrl(doc) {
  return {
    id: String(doc._id),
    shortCode: doc.shortCode,
    shortUrl: `${env.BASE_SHORT_URL}/${doc.shortCode}`,
    originalUrl: doc.originalUrl,
    title: doc.title ?? null,
    status: doc.status,
    state: getUrlState(doc),
    isCustomAlias: doc.isCustomAlias,
    isFavorite: doc.isFavorite,
    tags: doc.tags,
    clickCount: doc.clickCount,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// MongoDB error code 11000 means "this value must be unique, but it already exists".
const isDuplicateKey = (err) => err?.code === 11000;

export async function createUrl(ownerId, input) {
  const { href, host } = parseDestinationUrl(input.originalUrl);

  const data = {
    ownerId,
    originalUrl: href,
    originalHost: host,
    title: input.title,
    expiresAt: input.expiresAt ?? null,
    tags: [...new Set(input.tags ?? [])],
  };

  // A custom alias chosen by the user.
  if (input.customAlias) {
    const alias = validateAlias(input.customAlias);
    try {
      const doc = await Url.create({ ...data, shortCode: alias, isCustomAlias: true });
      return publicUrl(doc);
    } catch (err) {
      // The database's unique index is the final guard, even if two people ask at once.
      if (isDuplicateKey(err)) {
        throw new AppError(
          409,
          'ALIAS_TAKEN',
          'This alias is already taken. Please choose another.',
        );
      }
      throw err;
    }
  }

  // A random code. In the very rare case of a clash, we simply try another one.
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      const doc = await Url.create({ ...data, shortCode: generateShortCode() });
      return publicUrl(doc);
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
  }

  throw new AppError(
    500,
    'CODE_GENERATION_FAILED',
    'Could not create a short link right now. Please try again.',
  );
}