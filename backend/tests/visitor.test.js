import './setupEnv.js';
import { parseVisitor, parseReferrerHost, parseCountry } from '../src/utils/visitor.js';

const UA = {
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
};

const visit = (ua) => parseVisitor({ 'user-agent': ua });

describe('parseVisitor: people', () => {
  it.each([
    ['Windows Chrome', UA.windowsChrome, 'desktop', 'Chrome', 'Windows'],
    ['Android Chrome', UA.androidChrome, 'mobile', 'Chrome', 'Android'],
    ['iPhone Safari', UA.iphoneSafari, 'mobile', 'Safari', 'iOS'],
    ['iPad', UA.ipad, 'tablet', 'Safari', 'iOS'],
    ['Mac Safari', UA.macSafari, 'desktop', 'Safari', 'macOS'],
    ['Edge', UA.edge, 'desktop', 'Microsoft Edge', 'Windows'],
    ['Firefox', UA.firefox, 'desktop', 'Firefox', 'Linux'],
  ])('reads %s', (_name, ua, deviceType, browser, os) => {
    expect(visit(ua)).toMatchObject({ deviceType, browser, os, isBot: false });
  });
});

describe('parseVisitor: bots', () => {
  it.each([
    ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['curl', 'curl/8.4.0'],
    ['WhatsApp link preview', 'WhatsApp/2.23.20.0'],
    [
      'Facebook link preview',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    ],
    ['Slack link preview', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'],
  ])('spots %s as a bot', (_name, ua) => {
    expect(visit(ua)).toMatchObject({ deviceType: 'bot', isBot: true });
  });

  it('treats a visit with no browser text as a bot, without crashing', () => {
    expect(parseVisitor({})).toMatchObject({ deviceType: 'bot', isBot: true });
    expect(parseVisitor(undefined)).toMatchObject({ isBot: true });
    expect(parseVisitor({ 'user-agent': '' })).toMatchObject({ isBot: true });
  });

  it('copes with strange or huge browser text', () => {
    expect(() => visit('x'.repeat(100000))).not.toThrow();
    expect(() => visit('((((((')).not.toThrow();
  });
});

describe('parseReferrerHost', () => {
  it('keeps just the website name', () => {
    expect(parseReferrerHost('https://www.linkedin.com/feed/post/123?x=1')).toBe('linkedin.com');
    expect(parseReferrerHost('https://t.co/abc')).toBe('t.co');
    expect(parseReferrerHost('HTTP://News.Example.COM/a')).toBe('news.example.com');
  });

  it('says "direct" when there is no usable referrer', () => {
    expect(parseReferrerHost(undefined)).toBe('direct');
    expect(parseReferrerHost('')).toBe('direct');
    expect(parseReferrerHost('not a url')).toBe('direct');
    expect(parseReferrerHost('android-app://com.google.android.gm')).toBe('direct');
    expect(parseReferrerHost('javascript:alert(1)')).toBe('direct');
  });

  it('does not count our own site as a source', () => {
    expect(parseReferrerHost('https://go.example.com/x', 'go.example.com')).toBe('direct');
    expect(parseReferrerHost('https://www.go.example.com/x', 'go.example.com')).toBe('direct');
  });

  it('never returns something too long', () => {
    const long = `https://${'a'.repeat(300)}.com/`;
    expect(parseReferrerHost(long).length).toBeLessThanOrEqual(253);
  });
});

describe('parseCountry', () => {
  it('reads the country the hosting service gives us', () => {
    expect(parseCountry({ 'cf-ipcountry': 'in' })).toBe('IN');
    expect(parseCountry({ 'x-vercel-ip-country': 'US' })).toBe('US');
    expect(parseCountry({ 'cloudfront-viewer-country': ' de ' })).toBe('DE');
  });

  it('gives nothing when unknown or invalid', () => {
    expect(parseCountry({})).toBeUndefined();
    expect(parseCountry(undefined)).toBeUndefined();
    expect(parseCountry({ 'cf-ipcountry': 'XX' })).toBeUndefined();
    expect(parseCountry({ 'cf-ipcountry': 'T1' })).toBeUndefined();
    expect(parseCountry({ 'cf-ipcountry': 'India' })).toBeUndefined();
  });

  it('is included in a full visit', () => {
    const result = parseVisitor({
      'user-agent': UA.androidChrome,
      referer: 'https://www.linkedin.com/',
      'cf-ipcountry': 'IN',
    });
    expect(result).toEqual({
      referrerHost: 'linkedin.com',
      deviceType: 'mobile',
      browser: 'Chrome',
      os: 'Android',
      country: 'IN',
      isBot: false,
    });
  });
});