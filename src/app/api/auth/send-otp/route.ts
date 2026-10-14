import { NextRequest } from 'next/server';
import { SendOtpRequestSchema } from '@/schemas/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { redactSensitiveData } from '@/lib/redactor';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`otp-${ip}`, { maxRequests: 5, windowMs: 60000 });
    if (!rateCheck.success) {
      throw new AppError('Too many OTP requests. Please wait a minute before trying again.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await req.json();
    const parsed = SendOtpRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Invalid mobile number format', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const { phone } = parsed.data;
    logger.info(`Demo OTP dispatched to mobile: ${redactSensitiveData(phone)}`);

    return createSuccessResponse({
      message: 'OTP sent successfully',
      phone: `${phone.slice(0, 2)}XXXXXX${phone.slice(8)}`,
      demo_otp: '123456',
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to send OTP');
  }
}
