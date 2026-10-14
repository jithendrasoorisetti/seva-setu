import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

export async function POST() {
  try {
    const response = createSuccessResponse({
      message: 'Logged out successfully',
    });

    response.cookies.set('sevasetu_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return createErrorResponse(err, 'Failed to logout');
  }
}
