import './setupEnv.js';
import { generateShortCode, CODE_LENGTH } from '../src/utils/codegen.js';
import { validateAlias } from '../src/utils/alias.js';
import { isReservedAlias } from '../src/config/reserved.js';

describe('generateShortCode', () => {
  it('makes a 7 character code using only letters and numbers', () => {
    const code = generateShortCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(code).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('makes different codes every time', () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateShortCode()));
    expect(codes.size).toBe(2000);
  });

  it('uses uppercase letters, lowercase letters and digits', () => {
    const all = Array.from({ length: 300 }, () => generateShortCode()).join('');
    expect(all).toMatch(/[A-Z]/);
    expect(all).toMatch(/[a-z]/);
    expect(all).toMatch(/[0-9]/);
  });
});

describe('validateAlias', () => {
  it('accepts good aliases and makes them lowercase', () => {
    expect(validateAlias('portfolio')).toBe('portfolio');
    expect(validateAlias('  MyGitHub  ')).toBe('mygithub');
    expect(validateAlias('my-link_1')).toBe('my-link_1');
    expect(validateAlias('abc')).toBe('abc');
    expect(validateAlias('a'.repeat(32))).toHaveLength(32);
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(33)],
    ['starts with a dash', '-abc'],
    ['ends with a dash', 'abc-'],
    ['starts with an underscore', '_abc'],
    ['has a space', 'my link'],
    ['has a dot', 'my.link'],
    ['has a slash', 'my/link'],
    ['has special letters', 'ünï-link'],
    ['is empty', ''],
    ['is only spaces', '   '],
  ])('rejects an alias that %s', (_reason, alias) => {
    expect(() => validateAlias(alias)).toThrow(expect.objectContaining({ code: 'INVALID_ALIAS' }));
  });

  it('rejects things that are not text', () => {
    expect(() => validateAlias(undefined)).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(() => validateAlias(null)).toThrow(expect.objectContaining({ statusCode: 400 }));
    expect(() => validateAlias(123)).toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it('blocks reserved words in any letter case', () => {
    for (const word of ['api', 'admin', 'login', 'docs', 'ADMIN', ' Login ']) {
      expect(() => validateAlias(word)).toThrow(
        expect.objectContaining({ code: 'ALIAS_RESERVED' }),
      );
    }
  });

  it('allows words that only contain a reserved word', () => {
    expect(validateAlias('admin-panel')).toBe('admin-panel');
    expect(validateAlias('myapi')).toBe('myapi');
  });
});

describe('isReservedAlias', () => {
  it('ignores letter case', () => {
    expect(isReservedAlias('API')).toBe(true);
    expect(isReservedAlias('portfolio')).toBe(false);
  });
});