import crypto from 'node:crypto';

// A fake "urls" collection made of a plain list, with the same "shortCode must be unique" rule.
export const urls = [];

export function resetFakeUrls() {
  urls.length = 0;
}

function matches(doc, filter) {
  return Object.entries(filter).every(([key, value]) => (doc[key] ?? null) === value);
}

export const FakeUrl = {
  create: async (data) => {
    if (urls.some((u) => u.shortCode === data.shortCode)) {
      throw Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
    }
    const now = new Date();
    const url = {
      _id: crypto.randomUUID(),
      isCustomAlias: false,
      status: 'active',
      startsAt: null,
      expiresAt: null,
      clickCount: 0,
      tags: [],
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    urls.push(url);
    return url;
  },

  // Like the real one, this can be chained with .select() and .lean(), and then awaited.
  findOne: (filter) => {
    const query = {
      select: () => query,
      lean: () => query,
      then: (resolve, reject) =>
        Promise.resolve(urls.find((u) => matches(u, filter)) ?? null).then(resolve, reject),
    };
    return query;
  },

  updateOne: async (filter, update) => {
    const url = urls.find((u) => matches(u, filter));
    if (!url) return;
    for (const [key, amount] of Object.entries(update.$inc ?? {}))
      url[key] = (url[key] ?? 0) + amount;
    Object.assign(url, update.$set ?? {});
  },
};