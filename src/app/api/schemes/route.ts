import { getAllSchemes, hasUnverifiedSchemes } from '@/services/data/schemes';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    const schemes = getAllSchemes();
    const hasUnverified = hasUnverifiedSchemes();

    return createSuccessResponse({
      schemes,
      has_unverified_schemes: hasUnverified,
      banner_message: hasUnverified
        ? 'Scheme details are being verified. Confirm with the office before applying.'
        : null,
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to fetch welfare schemes');
  }
}
