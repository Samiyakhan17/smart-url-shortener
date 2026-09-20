import crypto from 'node:crypto';

// A fake "urls" collection made of a plain list, with the same "shortCode must be unique" rule.
export const urls = [];

export function resetFakeUrls() {
  urls.length = 0;
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
};