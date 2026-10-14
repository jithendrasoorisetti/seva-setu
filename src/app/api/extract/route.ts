import { NextRequest } from 'next/server';
import { ExtractRequestSchema } from '@/schemas/api';
import { extractCitizenFacts } from '@/services/ai/gemini';
import { getAllSchemes, hasUnverifiedSchemes } from '@/services/data/schemes';
import { evaluateAllSchemes } from '@/services/rules/engine';
import { checkRateLimit } from '@/lib/rateLimit';
import { processAndSanitizeImage } from '@/lib/image';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';
import { redactSensitiveData } from '@/lib/redactor';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, { maxRequests: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      throw new AppError('Too many extraction requests. Please wait a minute.', 'RATE_LIMITED', 429);
    }

    const body = await req.json();
    const validated = ExtractRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid request format', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const { text, image_base64, image_mime, language, current_profile } = validated.data;
    let inputDescription = text || '';

    if (image_base64) {
      const imgRes = processAndSanitizeImage(image_base64, image_mime);
      if (!imgRes.valid) {
        throw new AppError(imgRes.error || 'Invalid image file', 'INVALID_IMAGE', 400);
      }
      // Note: In mock/offline mode, image indicates a notice was provided
      inputDescription += ' [Citizen provided uploaded document notice photo for OCR processing]';
    }

    // Redact any sensitive numbers before sending to AI or logger
    const sanitizedInput = redactSensitiveData(inputDescription);

    // Extract facts
    const facts = await extractCitizenFacts(sanitizedInput, current_profile, language);

    // DETERMINISTIC RULES ENGINE: Matches extracted profile with schemes. LLM NEVER decides eligibility!
    const schemes = getAllSchemes();
    const schemeResults = evaluateAllSchemes(schemes, facts.profile);
    const hasUnverified = hasUnverifiedSchemes();

    return createSuccessResponse({
      facts,
      results: schemeResults,
      has_unverified_schemes: hasUnverified,
      banner_message: hasUnverified
        ? 'Scheme details are being verified. Confirm with the office before applying.'
        : null,
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to extract facts and evaluate schemes');
  }
}
