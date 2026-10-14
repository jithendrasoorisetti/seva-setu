import { NextRequest } from 'next/server';
import { SttRequestSchema } from '@/schemas/api';
import { transcribeAudio } from '@/services/google/stt';
import { checkRateLimit } from '@/lib/rateLimit';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, { maxRequests: 20, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      throw new AppError('Rate limit exceeded for speech-to-text.', 'RATE_LIMITED', 429);
    }

    const body = await req.json();
    const validated = SttRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid STT request body', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const result = await transcribeAudio(validated.data.audio_base64, validated.data.language_code);
    return createSuccessResponse(result);
  } catch (err) {
    return createErrorResponse(err, 'Failed to process speech-to-text request');
  }
}
