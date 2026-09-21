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
      _id: crypto.randomBytes(12).toString('hex'), // looks like a real MongoDB id
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
      // Like a real document, it can be changed and then saved.
      async save() {
        this.updatedAt = new Date();
        return this;
      },
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

  // A list query: supports .sort({ createdAt: -1 }), .skip() and .limit().
  find: (filter) => {
    let newestFirst = false;
    let skipCount = 0;
    let limitCount = Infinity;
    const query = {
      sort: (spec) => {
        newestFirst = spec?.createdAt === -1;
        return query;
      },
      skip: (n) => {
        skipCount = n;
        return query;
      },
      limit: (n) => {
        limitCount = n;
        return query;
      },
      then: (resolve, reject) => {
        let rows = urls.filter((u) => matches(u, filter));
        if (newestFirst) rows = rows.reverse();
        return Promise.resolve(rows.slice(skipCount, skipCount + limitCount)).then(resolve, reject);
      },
    };
    return query;
  },

  countDocuments: async (filter) => urls.filter((u) => matches(u, filter)).length,

  updateOne: async (filter, update) => {
    const url = urls.find((u) => matches(u, filter));
    if (!url) return;
    for (const [key, amount] of Object.entries(update.$inc ?? {}))
      url[key] = (url[key] ?? 0) + amount;
    Object.assign(url, update.$set ?? {});
  },
};