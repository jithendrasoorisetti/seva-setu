import { describe, it, expect } from 'vitest';
import { POST as explainHandler } from '@/app/api/explain/route';
import { NextRequest } from 'next/server';

function createExplainRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest('http://localhost:3000/api/explain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/explain Integration Tests', () => {
  it('generates an explanation in English with official source link and verification note', async () => {
    const req = createExplainRequest({
      scheme_id: 'ap-ysr-rythu-bharosa',
      language: 'en',
      decision: 'LIKELY_ELIGIBLE',
      matched_rules: ['AP resident', 'Farmer occupation', 'Land within 5 acres'],
      unmatched_rules: [],
      missing_facts: [],
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.explanation).toBeTruthy();
    expect(json.data.official_source_url).toContain('ysrrythubharosa.ap.gov.in');
    expect(json.data.last_verified_date).toBeTruthy();
    expect(json.data.data_status).toBe('UNVERIFIED');
  });

  it('generates an explanation in Telugu', async () => {
    const req = createExplainRequest({
      scheme_id: 'ap-ysr-pension-kanuka',
      language: 'te',
      decision: 'LIKELY_ELIGIBLE',
      matched_rules: ['ఆంధ్రప్రదేశ్ నివాసి', 'వయస్సు 60 ఏళ్లు దాటింది'],
      unmatched_rules: [],
      missing_facts: [],
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.explanation).toContain('సచివాలయ');
  });

  it('returns 404 if scheme does not exist', async () => {
    const req = createExplainRequest({
      scheme_id: 'non-existent-scheme',
      language: 'en',
      decision: 'LIKELY_ELIGIBLE',
      matched_rules: [],
      unmatched_rules: [],
      missing_facts: [],
    });

    const res = await explainHandler(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('SCHEME_NOT_FOUND');
  });
});
