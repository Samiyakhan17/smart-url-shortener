import crypto from 'node:crypto';

// A tiny fake database made of plain lists, so tests need no real MongoDB.
export const users = [];
export const tokens = [];

export function resetFakeDb() {
  users.length = 0;
  tokens.length = 0;
}

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$gt' in cond) return doc[key] > cond.$gt;
    return (doc[key] ?? null) === cond;
  });
}

export const FakeUser = {
  findOne: (filter) => ({ select: async () => users.find((u) => matches(u, filter)) ?? null }),
  findById: async (id) => users.find((u) => u._id === id) ?? null,
  create: async (data) => {
    const user = {
      _id: crypto.randomUUID(),
      role: 'user',
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      ...data,
    };
    users.push(user);
    return user;
  },
  updateOne: async (filter, update) => {
    Object.assign(
      users.find((u) => matches(u, filter)),
      update,
    );
  },
};

export const FakeToken = {
  create: async (data) => {
    const t = { _id: crypto.randomUUID(), revokedAt: null, replacedBy: null, ...data };
    tokens.push(t);
    return t;
  },
  findOne: async (filter) => tokens.find((t) => matches(t, filter)) ?? null,
  findOneAndUpdate: async (filter, update) => {
    const t = tokens.find((x) => matches(x, filter));
    if (!t) return null;
    const before = { ...t };
    Object.assign(t, update);
    return before;
  },
  updateOne: async (filter, update) => {
    const t = tokens.find((x) => matches(x, filter));
    if (t) Object.assign(t, update);
  },
  updateMany: async (filter, update) => {
    tokens.filter((x) => matches(x, filter)).forEach((t) => Object.assign(t, update));
  },
};