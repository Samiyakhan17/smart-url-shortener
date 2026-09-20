import './setupEnv.js';
import { parseDestinationUrl } from '../src/utils/urlSafety.js';

const ok = (input, opts) => parseDestinationUrl(input, opts);
const bad = (input, opts) => expect(() => parseDestinationUrl(input, opts)).toThrow(/./);

describe('valid links', () => {
  it('accepts normal http and https links', () => {
    expect(ok('https://example.com/a-page?x=1#top').href).toBe(
      'https://example.com/a-page?x=1#top',
    );
    expect(ok('http://example.com').host).toBe('example.com');
  });

  it('cleans the link up', () => {
    expect(ok('  HTTPS://Example.COM:443/Path  ').href).toBe('https://example.com/Path');
  });

  it('turns international domain names into safe ASCII form', () => {
    expect(ok('https://münchen.de').host).toBe('xn--mnchen-3ya.de');
  });

  it('allows public IP addresses', () => {
    expect(ok('http://8.8.8.8/x').host).toBe('8.8.8.8');
    expect(ok('http://172.32.0.1').host).toBe('172.32.0.1'); // just outside the private range
  });
});

describe('dangerous schemes', () => {
  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'ftp://example.com/file',
    'vbscript:msgbox(1)',
  ])('blocks %s', (input) => bad(input));
});

describe('bad input', () => {
  it.each(['', '   ', 'example.com', 'not a url', 'http://'])('rejects %j', (input) => bad(input));

  it('rejects things that are not text', () => {
    bad(undefined);
    bad(null);
    bad(123);
    bad({});
  });

  it('rejects very long links', () => {
    bad('https://example.com/' + 'a'.repeat(2100));
  });

  it('rejects links with a username or password', () => {
    bad('https://user:pass@example.com');
    bad('https://user@example.com');
  });
});

describe('private and internal addresses', () => {
  it.each([
    'http://localhost',
    'http://localhost:3000/admin',
    'http://app.localhost',
    'http://127.0.0.1',
    'http://127.5.5.5',
    'http://0.0.0.0',
    'http://10.0.0.5',
    'http://192.168.1.1',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://169.254.169.254/latest/meta-data',
    'http://100.64.0.1',
    'http://224.0.0.1',
    'http://[::1]/',
    'http://[fd00::1]/',
    'http://[::ffff:127.0.0.1]/',
  ])('blocks %s', (input) => bad(input));

  it('blocks tricky ways of writing 127.0.0.1', () => {
    bad('http://2130706433/'); // one big number
    bad('http://0x7f.0.0.1/'); // hexadecimal
    bad('http://0177.0.0.1/'); // octal
    bad('http://127.1/'); // short form
  });
});

describe('own domain', () => {
  it('blocks links that point back at the shortener', () => {
    bad('https://go.example.com/abc', { ownHost: 'go.example.com' });
  });

  it('allows other domains', () => {
    expect(ok('https://example.com', { ownHost: 'go.example.com' }).host).toBe('example.com');
  });
});

describe('error type', () => {
  it('gives a 400 INVALID_URL error the API can send to the user', () => {
    try {
      parseDestinationUrl('javascript:alert(1)');
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('INVALID_URL');
    }
    expect.assertions(2);
  });
});