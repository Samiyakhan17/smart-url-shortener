import './setupEnv.js';
import { generateApiKey, getApiKeyPrefix, hashApiKey } from '../src/utils/apiKeys.js';
import { getPlanLimits } from '../src/config/plans.js';

describe('API key helpers', () => {
  it('creates a unique, securely shaped secret and only persists its hash', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^usk_live_[A-Za-z0-9_-]{43}$/);
    expect(generateApiKey()).not.toBe(key);
    expect(hashApiKey(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashApiKey(key)).not.toBe(key);
    expect(getApiKeyPrefix(key)).toBe('usk_live');
  });
});

describe('plan limits', () => {
  it('uses free limits for an unknown plan', () => {
    expect(getPlanLimits('free')).toEqual({ activeLinks: 100, dailyCreates: 25 });
    expect(getPlanLimits('unknown')).toEqual(getPlanLimits('free'));
  });
});
