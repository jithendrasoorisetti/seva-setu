import { NextRequest, NextResponse } from 'next/server';
import { ExplainRequestSchema } from '@/schemas/api';
import { getSchemeById } from '@/services/data/schemes';
import { generateSchemeExplanation } from '@/services/ai/gemini';
import { checkRateLimit } from '@/lib/rateLimit';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, { maxRequests: 30, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      throw new AppError('Rate limit exceeded for explanations.', 'RATE_LIMITED', 429);
    }

    const body = await req.json();
    const validated = ExplainRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid explanation request', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const { scheme_id, language, decision, matched_rules, unmatched_rules, missing_facts } =
      validated.data;

    const scheme = getSchemeById(scheme_id);
    if (!scheme) {
      throw new AppError(`Scheme with ID '${scheme_id}' not found`, 'SCHEME_NOT_FOUND', 404);
    }

    const explanation = await generateSchemeExplanation(
      scheme,
      decision,
      matched_rules,
      unmatched_rules,
      missing_facts,
      language,
    );

    // Check if client requested a streamed response
    const wantsStream = req.headers.get('accept')?.includes('text/event-stream');
    if (wantsStream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          // Stream sentences with natural typing cadence
          const sentences = explanation.split(/(?<=[.!?।])\s+/);
          for (const s of sentences) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: s + ' ' })}\n\n`));
            await new Promise((r) => setTimeout(r, 40));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    return createSuccessResponse({
      scheme_id,
      explanation,
      official_source_url: scheme.official_source_url,
      last_verified_date: scheme.last_verified_date,
      data_status: scheme.data_status,
      office_contact_info: scheme.office_contact_info,
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to generate scheme explanation');
  }
}
