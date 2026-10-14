import { NextRequest } from 'next/server';
import { ChecklistSaveRequestSchema } from '@/schemas/api';
import { saveUserChecklist, getUserChecklist } from '@/services/google/firestore';
import { createSuccessResponse, createErrorResponse, AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const schemeId = searchParams.get('scheme_id');

    if (!userId || !schemeId) {
      throw new AppError('Both user_id and scheme_id are required query parameters', 'MISSING_PARAMS', 400);
    }

    const record = await getUserChecklist(userId, schemeId);
    return createSuccessResponse({ checklist: record });
  } catch (err) {
    return createErrorResponse(err, 'Failed to retrieve checklist');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ChecklistSaveRequestSchema.safeParse(body);
    if (!validated.success) {
      throw new AppError('Invalid checklist save payload', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const { user_id, scheme_id, checked_document_ids } = validated.data;
    const updatedAt = new Date().toISOString();

    await saveUserChecklist({
      userId: user_id,
      schemeId: scheme_id,
      checkedDocumentIds: checked_document_ids,
      updatedAt,
    });

    return createSuccessResponse({
      saved: true,
      user_id,
      scheme_id,
      checked_count: checked_document_ids.length,
      updatedAt,
    });
  } catch (err) {
    return createErrorResponse(err, 'Failed to save checklist');
  }
}
