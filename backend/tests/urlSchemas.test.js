import './setupEnv.js';
import { createUrlSchema } from '../src/validators/urlSchemas.js';

const parse = (input) => createUrlSchema.safeParse(input);
const future = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('createUrlSchema', () => {
  it('accepts just a destination URL', () => {
    const r = parse({ originalUrl: 'https://example.com' });
    expect(r.success).toBe(true);
  });

  it('accepts every field and turns the expiry into a Date', () => {
    const r = parse({
      originalUrl: ' https://example.com/page ',
      customAlias: ' Portfolio ',
      title: ' My site ',
      expiresAt: future(30),
      tags: ['Work', 'cv-2026'],
    });
    expect(r.success).toBe(true);
    expect(r.data.originalUrl).toBe('https://example.com/page');
    expect(r.data.title).toBe('My site');
    expect(r.data.expiresAt).toBeInstanceOf(Date);
    expect(r.data.tags).toEqual(['work', 'cv-2026']);
  });

  it('treats empty text boxes as "not entered"', () => {
    const r = parse({ originalUrl: 'https://example.com', customAlias: '', title: '   ' });
    expect(r.success).toBe(true);
    expect(r.data.customAlias).toBeUndefined();
    expect(r.data.title).toBeUndefined();
  });

  it('allows expiresAt to be null (never expires)', () => {
    expect(parse({ originalUrl: 'https://example.com', expiresAt: null }).success).toBe(true);
  });

  it('requires a destination URL', () => {
    expect(parse({}).success).toBe(false);
    expect(parse({ originalUrl: '' }).success).toBe(false);
    expect(parse({ originalUrl: 123 }).success).toBe(false);
  });

  it('rejects a bad expiry', () => {
    const base = { originalUrl: 'https://example.com' };
    expect(parse({ ...base, expiresAt: 'tomorrow' }).success).toBe(false);
    expect(parse({ ...base, expiresAt: '2020-01-01T00:00:00Z' }).success).toBe(false); // in the past
    expect(parse({ ...base, expiresAt: future(365 * 6) }).success).toBe(false); // over 5 years
  });

  it('rejects bad tags', () => {
    const base = { originalUrl: 'https://example.com' };
    expect(parse({ ...base, tags: ['has space'] }).success).toBe(false);
    expect(parse({ ...base, tags: ['x'.repeat(25)] }).success).toBe(false);
    expect(parse({ ...base, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success).toBe(
      false,
    );
  });

  it('throws away fields the user must not set', () => {
    const r = parse({
      originalUrl: 'https://example.com',
      ownerId: 'someone-else',
      clickCount: 9999,
      status: 'blocked',
      shortCode: 'hacked',
    });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ originalUrl: 'https://example.com' });
  });
});