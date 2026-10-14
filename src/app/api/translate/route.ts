import { NextRequest } from 'next/server';
import { TranslateRequestSchema } from '@/schemas/api';
import { translateText } from '@/services/google/translate';
import { checkRateLimit } from '@/lib/rateLimit';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, { maxRequests: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      throw new AppError('Rate limit exceeded for translation.', 'RATE_LIMITED', 429);
    }

    const body = await req.json();
    const validated = TranslateRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid translation request body', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const result = await translateText(
      validated.data.text,
      validated.data.source_lang,
      validated.data.target_lang,
    );
    return createSuccessResponse(result);
  } catch (err) {
    return createErrorResponse(err, 'Failed to process translation request');
  }
}
