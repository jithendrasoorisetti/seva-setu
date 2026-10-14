import { NextRequest } from 'next/server';
import { LoginRequestSchema, UserProfile } from '@/schemas/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { redactSensitiveData } from '@/lib/redactor';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`login-${ip}`, { maxRequests: 10, windowMs: 60000 });
    if (!rateCheck.success) {
      throw new AppError('Too many login attempts. Please wait a minute before trying again.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    const body = await req.json();
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Invalid login request', 'VALIDATION_ERROR', 400, parsed.error.format());
    }

    const { role, phone, otp, volunteer_id } = parsed.data;

    // Verify OTP (accepts demo OTP 123456 or any 6-digit for sandbox testing)
    if (otp !== '123456' && !/^\d{6}$/.test(otp)) {
      throw new AppError('Invalid OTP entered. Please use 123456 for testing.', 'AUTH_FAILED', 401);
    }

    const maskedPhone = `${phone.slice(0, 2)}XXXXXX${phone.slice(8)}`;

    const user: UserProfile =
      role === 'VOLUNTEER'
        ? {
            user_id: `usr_vol_${phone.slice(6)}`,
            name: 'K. Bhavani',
            role: 'VOLUNTEER',
            masked_phone: maskedPhone,
            district: 'Guntur',
            mandal: 'Guntur Urban',
            cluster_id: volunteer_id || 'V-AP-GNT-1042',
          }
        : {
            user_id: `usr_cit_${phone.slice(6)}`,
            name: 'R. Ramanjaneyulu',
            role: 'CITIZEN',
            masked_phone: maskedPhone,
            district: 'Anantapur',
            mandal: 'Dharmavaram',
          };

    logger.info(`User logged in successfully: role=${role}, phone=${redactSensitiveData(phone)}`);

    const sessionPayload = {
      user,
      token: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = createSuccessResponse({
      message: 'Login successful',
      user,
    });

    // Set HttpOnly, Secure, SameSite=Lax cookie
    response.cookies.set('sevasetu_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return createErrorResponse(err, 'Authentication failed');
  }
}
