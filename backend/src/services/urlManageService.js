import { Url } from '../models/Url.js';

import { AppError } from '../utils/errors.js';

import { parseDestinationUrl } from '../utils/urlSafety.js';

import { publicUrl } from './urlService.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

const notFound = () => new AppError(404, 'NOT_FOUND', 'Link not found.');

// Finds a link that belongs to this user. Someone else's link looks exactly like a missing one,
// so nobody can find out which links exist.
async function findOwned(ownerId, id) {
  if (!OBJECT_ID.test(id)) throw notFound();
  const url = await Url.findOne({ _id: id, ownerId, deletedAt: null });
  if (!url) throw notFound();
  return url;
}
export async function listUrls(ownerId, { page, limit, search, status, favorite, sort },) {
  const filter = { ownerId, deletedAt: null };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalUrl: { $regex: search, $options: 'i' } },
      { shortCode: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
  filter.status = status;
   }
   
  if (favorite !== undefined) {
  filter.isFavorite = favorite;
  }

  const sortOption = sort === 'clickCount'
  ? { clickCount: -1 }
  : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Url.find(filter)
  .sort(sortOption)
  .skip((page - 1) * limit)
  .limit(limit),
    Url.countDocuments(filter),
  ]);

  return {
    items: items.map(publicUrl),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUrl(ownerId, id) {
  return publicUrl(await findOwned(ownerId, id));
}

export async function updateUrl(ownerId, id, changes) {
  const url = await findOwned(ownerId, id);

  if (url.status === 'blocked') {
    throw new AppError(
      403,
      'LINK_BLOCKED',
      'This link was blocked by an administrator and cannot be changed.',
    );
  }

  if ('originalUrl' in changes) {
    const { href, host } = parseDestinationUrl(changes.originalUrl);
    url.originalUrl = href;
    url.originalHost = host;
  }

  for (const field of ['title', 'expiresAt', 'status', 'isFavorite']) {
    if (field in changes) url[field] = changes[field];
  }

  if ('tags' in changes) url.tags = [...new Set(changes.tags)];

  await url.save();
  return publicUrl(url);
}

// "Soft" delete: the link is hidden and stops working, but the row stays in the database.
// (That also keeps its short code reserved, so nobody else can take over an old link.)
export async function deleteUrl(ownerId, id) {
  const url = await findOwned(ownerId, id);
  url.deletedAt = new Date();
  await url.save();
}