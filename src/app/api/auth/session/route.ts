import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';
import { UserProfile } from '@/schemas/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('sevasetu_session')?.value;
    if (!sessionCookie) {
      return createSuccessResponse({
        authenticated: false,
        user: null,
      });
    }

    const session = JSON.parse(sessionCookie) as { user: UserProfile; expires_at: string };
    if (new Date(session.expires_at) < new Date()) {
      return createSuccessResponse({
        authenticated: false,
        user: null,
      });
    }

    return createSuccessResponse({
      authenticated: true,
      user: session.user,
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to fetch session');
  }
}
