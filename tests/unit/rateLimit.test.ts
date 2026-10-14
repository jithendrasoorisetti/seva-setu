import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimiter } from '@/lib/rateLimit';

describe('Rate Limiter Unit Tests', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows requests within burst limit', () => {
    const config = { maxRequests: 3, windowMs: 1000 };
    const ip = '192.168.1.1';

    expect(checkRateLimit(ip, config).success).toBe(true);
    expect(checkRateLimit(ip, config).success).toBe(true);
    expect(checkRateLimit(ip, config).success).toBe(true);
  });

  it('blocks requests once token bucket is exhausted', () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    const ip = '10.0.0.5';

    expect(checkRateLimit(ip, config).success).toBe(true);
    expect(checkRateLimit(ip, config).success).toBe(true);

    const blocked = checkRateLimit(ip, config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it('tracks distinct IP addresses independently', () => {
    const config = { maxRequests: 1, windowMs: 1000 };

    expect(checkRateLimit('1.1.1.1', config).success).toBe(true);
    expect(checkRateLimit('1.1.1.1', config).success).toBe(false);

    // IP 2.2.2.2 still has its own token
    expect(checkRateLimit('2.2.2.2', config).success).toBe(true);
  });
});
