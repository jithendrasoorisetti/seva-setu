import { describe, it, expect } from 'vitest';
import { POST as sttHandler } from '@/app/api/stt/route';
import { NextRequest } from 'next/server';

describe('POST /api/stt Integration Tests', () => {
  it('handles speech-to-text request gracefully with fallback when feature flag is off', async () => {
    const req = new NextRequest('http://localhost:3000/api/stt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: 'UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        language_code: 'te-IN',
      }),
    });

    const res = await sttHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.source).toBe('fallback-empty');
  });
});
