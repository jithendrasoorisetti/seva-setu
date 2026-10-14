import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Sha256Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;

  constructor(ttlMinutes = 10) {
    this.defaultTtlMs = ttlMinutes * 60 * 1000;
  }

  public static hashKey(input: string): string {
    const normalized = input.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  public get(key: string): T | null {
    const hash = Sha256Cache.hashKey(key);
    const entry = this.store.get(hash);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(hash);
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: T, ttlMs?: number): void {
    const hash = Sha256Cache.hashKey(key);
    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);
    this.store.set(hash, { value, expiresAt });
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}

// Global caches for fact extraction and plain-language explanation
export const extractionCache = new Sha256Cache<unknown>(10);
export const explanationCache = new Sha256Cache<string>(10);
