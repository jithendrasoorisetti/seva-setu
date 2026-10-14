import { describe, it, expect } from 'vitest';
import { POST as draftHandler } from '@/app/api/draft/route';
import { NextRequest } from 'next/server';

function createDraftRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/draft Integration Tests', () => {
  it('generates downloadable pre-filled draft application with verification metadata', async () => {
    const req = createDraftRequest({
      scheme_id: 'ap-ysr-rythu-bharosa',
      language: 'en',
      applicant_name: 'Subba Rao',
      district: 'Guntur',
      mandal: 'Tenali',
      village_ward: 'Ward 4',
      profile: {
        age: 52,
        occupation: 'FARMER',
        land_ownership_acres: 3,
        has_white_ration_card: true,
      },
    });

    const res = await draftHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="sevasetu-draft-ap-ysr-rythu-bharosa.txt"');

    const text = await res.text();
    expect(text).toContain('SEVASETU');
    expect(text).toContain('Subba Rao');
    expect(text).toContain('52 years');
    expect(text).toContain('3 Acres');
    expect(text).toContain('Tenali');
    expect(text).toContain('https://ysrrythubharosa.ap.gov.in');
    expect(text).toContain('Verify with the office before applying.');
  });

  it('redacts sensitive numbers if inadvertently passed in free text fields', async () => {
    const req = createDraftRequest({
      scheme_id: 'ap-ysr-pension-kanuka',
      language: 'en',
      applicant_name: 'Rao Aadhaar 9999 8888 7777',
      profile: { age: 65 },
    });

    const res = await draftHandler(req);
    const text = await res.text();
    expect(text).not.toContain('9999 8888 7777');
    expect(text).toContain('[REDACTED-ID-XXXX-XXXX-7777]');
  });
});
