import { describe, it, expect, beforeEach } from 'vitest';
import { Sha256Cache } from '@/services/ai/cache';

describe('Sha256Cache Unit Tests', () => {
  let cache: Sha256Cache<string>;

  beforeEach(() => {
    cache = new Sha256Cache<string>(1); // 1 minute TTL
  });

  it('computes consistent sha256 keys ignoring casing and surrounding whitespace', () => {
    const key1 = '  Farmer from Guntur ';
    const key2 = 'farmer from guntur';
    expect(Sha256Cache.hashKey(key1)).toBe(Sha256Cache.hashKey(key2));
  });

  it('stores and retrieves cached values', () => {
    cache.set('query-1', 'result-value');
    expect(cache.get('query-1')).toBe('result-value');
  });

  it('returns null on cache miss', () => {
    expect(cache.get('non-existent-key')).toBeNull();
  });

  it('expires entries after TTL elapses', async () => {
    const shortTtlCache = new Sha256Cache<string>(1 / 60); // 1 second TTL
    shortTtlCache.set('temp', 'temporary', 10); // 10ms TTL
    await new Promise((r) => setTimeout(r, 20));
    expect(shortTtlCache.get('temp')).toBeNull();
  });
});
