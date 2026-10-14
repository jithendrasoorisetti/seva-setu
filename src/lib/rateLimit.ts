/**
 * Token Bucket Rate Limiter
 * Implemented in-memory for serverless/local environments with automatic window eviction.
 *
 * NOTE FOR PRODUCTION AT SCALE:
 * For multi-instance Cloud Run or Kubernetes deployments, replace this in-memory bucket
 * with a centralized store (e.g., Google Cloud Memorystore for Redis) or apply edge
 * rate limiting via Google Cloud Armor / Cloudflare Web Application Firewall (WAF).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  maxRequests: number; // Maximum burst / window capacity
  windowMs: number; // Window duration in milliseconds
}

const ipBuckets = new Map<string, Bucket>();

// Periodic garbage collection every 5 minutes to prevent memory leaks from one-off IPs
const GC_INTERVAL_MS = 5 * 60 * 1000;
let lastGc = Date.now();

function cleanupExpiredBuckets(windowMs: number) {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;

  for (const [ip, bucket] of ipBuckets.entries()) {
    if (now - bucket.lastRefill > windowMs * 2) {
      ipBuckets.delete(ip);
    }
  }
}

/**
 * Checks if a request from a given client IP is within rate limits.
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = { maxRequests: 20, windowMs: 60 * 1000 },
): { success: boolean; limit: number; remaining: number; resetMs: number } {
  const now = Date.now();
  cleanupExpiredBuckets(config.windowMs);

  const key = ip || 'anonymous';
  let bucket = ipBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.maxRequests, lastRefill: now };
    ipBuckets.set(key, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    if (elapsed > config.windowMs) {
      bucket.tokens = config.maxRequests;
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return {
      success: true,
      limit: config.maxRequests,
      remaining: bucket.tokens,
      resetMs: Math.max(0, config.windowMs - (now - bucket.lastRefill)),
    };
  }

  return {
    success: false,
    limit: config.maxRequests,
    remaining: 0,
    resetMs: Math.max(0, config.windowMs - (now - bucket.lastRefill)),
  };
}

/**
 * Utility to reset rate limiter storage (primarily for automated unit tests).
 */
export function resetRateLimiter(): void {
  ipBuckets.clear();
  lastGc = Date.now();
}
