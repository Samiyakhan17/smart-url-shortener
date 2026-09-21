import './setupEnv.js';
import mongoose from 'mongoose';
import { Click } from '../src/models/Click.js';

const urlId = new mongoose.Types.ObjectId();

describe('Click model', () => {
  it('fills in sensible defaults', () => {
    const click = new Click({ urlId });
    expect(click.ts).toBeInstanceOf(Date);
    expect(click.referrerHost).toBe('direct');
    expect(click.deviceType).toBe('other');
    expect(click.isBot).toBe(false);
  });

  it('requires a link id', async () => {
    await expect(new Click({}).validate()).rejects.toThrow(/urlId/);
  });

  it('cleans up the referrer and the country', () => {
    const click = new Click({ urlId, referrerHost: '  Twitter.COM ', country: 'in' });
    expect(click.referrerHost).toBe('twitter.com');
    expect(click.country).toBe('IN');
  });

  it('rejects an unknown device type', async () => {
    await expect(new Click({ urlId, deviceType: 'fridge' }).validate()).rejects.toThrow(
      /deviceType/,
    );
  });

  it('rejects a country that is not a 2-letter code', async () => {
    await expect(new Click({ urlId, country: 'India' }).validate()).rejects.toThrow(/country/);
  });

  it('accepts a full, valid click', async () => {
    const click = new Click({
      urlId,
      referrerHost: 'linkedin.com',
      deviceType: 'mobile',
      browser: 'Chrome',
      os: 'Android',
      country: 'IN',
    });
    await expect(click.validate()).resolves.toBeUndefined();
  });

  it('stores no IP address or full user-agent text', () => {
    const fields = Object.keys(Click.schema.paths);
    expect(fields).not.toContain('ip');
    expect(fields).not.toContain('userAgent');
  });

  it('has the indexes for fast analytics and automatic clean-up', () => {
    const indexes = Click.schema.indexes();
    const hasIndex = (keys) =>
      indexes.some(([spec]) => JSON.stringify(spec) === JSON.stringify(keys));
    expect(hasIndex({ urlId: 1, ts: -1 })).toBe(true);

    const ttl = indexes.find(([spec]) => JSON.stringify(spec) === JSON.stringify({ ts: 1 }));
    expect(ttl[1].expireAfterSeconds).toBe(365 * 24 * 60 * 60);
  });
});