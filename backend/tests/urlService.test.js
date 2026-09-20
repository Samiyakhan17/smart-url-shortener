import './setupEnv.js';
import { jest } from '@jest/globals';
import { FakeUrl, urls, resetFakeUrls } from './fakeUrls.js';

// A predictable code generator: 0000001, 0000002, ... so we can test clashes on purpose.
let counter = 0;
const generateShortCode = jest.fn(() => String(++counter).padStart(7, '0'));

jest.unstable_mockModule('../src/models/Url.js', () => ({ Url: FakeUrl }));
jest.unstable_mockModule('../src/utils/codegen.js', () => ({ generateShortCode }));

const { createUrl } = await import('../src/services/urlService.js');

const owner = 'user-1';
const site = 'https://example.com/a-very-long-page';

beforeEach(() => {
  resetFakeUrls();
  counter = 0;
  generateShortCode.mockClear();
  generateShortCode.mockImplementation(() => String(++counter).padStart(7, '0'));
});

describe('createUrl with a random code', () => {
  it('saves the link and returns the short URL', async () => {
    const link = await createUrl(owner, { originalUrl: site });
    expect(link.shortCode).toBe('0000001');
    expect(link.shortUrl).toBe('http://localhost:4000/0000001');
    expect(link.originalUrl).toBe(site);
    expect(link.state).toBe('active');
    expect(link.clickCount).toBe(0);
    expect(link.isCustomAlias).toBe(false);
    expect(urls[0].ownerId).toBe(owner);
    expect(urls[0].originalHost).toBe('example.com');
  });

  it('saves the cleaned-up destination URL', async () => {
    await createUrl(owner, { originalUrl: 'HTTPS://Example.COM:443/x' });
    expect(urls[0].originalUrl).toBe('https://example.com/x');
  });

  it('saves title, expiry and tags (without repeats)', async () => {
    const expiresAt = new Date(Date.now() + 86400000);
    const link = await createUrl(owner, {
      originalUrl: site,
      title: 'My page',
      expiresAt,
      tags: ['work', 'work', 'cv'],
    });
    expect(link.title).toBe('My page');
    expect(link.expiresAt).toBe(expiresAt);
    expect(link.tags).toEqual(['work', 'cv']);
  });

  it('tries another code if the first one is already taken', async () => {
    await createUrl(owner, { originalUrl: site }); // takes 0000001
    generateShortCode.mockClear(); // start counting calls from here
    generateShortCode.mockReturnValueOnce('0000001').mockReturnValueOnce('0000009');
    const link = await createUrl(owner, { originalUrl: site });
    expect(link.shortCode).toBe('0000009');
    expect(generateShortCode).toHaveBeenCalledTimes(2);
  });

  it('gives up with a clear error after 5 clashes', async () => {
    await createUrl(owner, { originalUrl: site });
    generateShortCode.mockClear(); // start counting calls from here
    generateShortCode.mockReturnValue('0000001');
    await expect(createUrl(owner, { originalUrl: site })).rejects.toMatchObject({
      statusCode: 500,
      code: 'CODE_GENERATION_FAILED',
    });
    expect(generateShortCode).toHaveBeenCalledTimes(5);
  });
});

describe('createUrl with a custom alias', () => {
  it('uses the alias, in lowercase', async () => {
    const link = await createUrl(owner, { originalUrl: site, customAlias: ' Portfolio ' });
    expect(link.shortCode).toBe('portfolio');
    expect(link.shortUrl).toBe('http://localhost:4000/portfolio');
    expect(link.isCustomAlias).toBe(true);
    expect(generateShortCode).not.toHaveBeenCalled();
  });

  it('says 409 when the alias is already taken', async () => {
    await createUrl(owner, { originalUrl: site, customAlias: 'portfolio' });
    await expect(
      createUrl('user-2', { originalUrl: site, customAlias: 'PORTFOLIO' }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'ALIAS_TAKEN' });
    expect(urls).toHaveLength(1);
  });

  it('rejects reserved and invalid aliases without saving anything', async () => {
    await expect(
      createUrl(owner, { originalUrl: site, customAlias: 'admin' }),
    ).rejects.toMatchObject({
      code: 'ALIAS_RESERVED',
    });
    await expect(createUrl(owner, { originalUrl: site, customAlias: 'a b' })).rejects.toMatchObject(
      {
        code: 'INVALID_ALIAS',
      },
    );
    expect(urls).toHaveLength(0);
  });
});

describe('createUrl with a bad destination', () => {
  it.each(['javascript:alert(1)', 'http://localhost:3000', 'http://169.254.169.254', 'not a url'])(
    'rejects %s and saves nothing',
    async (originalUrl) => {
      await expect(createUrl(owner, { originalUrl })).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_URL',
      });
      expect(urls).toHaveLength(0);
    },
  );
});