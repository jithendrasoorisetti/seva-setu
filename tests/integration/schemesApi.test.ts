import { describe, it, expect } from 'vitest';
import { GET as schemesHandler } from '@/app/api/schemes/route';

describe('GET /api/schemes Integration Tests', () => {
  it('returns all schemes with verification flags', async () => {
    const res = await schemesHandler();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.schemes.length).toBeGreaterThanOrEqual(5);
    expect(json.data.has_unverified_schemes).toBe(true);
    expect(json.data.banner_message).toContain('Scheme details are being verified');

    for (const scheme of json.data.schemes) {
      expect(scheme.official_source_url).toBeTruthy();
      expect(scheme.last_verified_date).toBeTruthy();
    }
  });
});
