import { NextResponse } from 'next/server';
import { ApiResponse } from '@/schemas/api';
import { logger } from './logger';

export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function createErrorResponse(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  defaultStatus = 500,
): NextResponse<ApiResponse<never>> {
  if (error instanceof AppError) {
    logger.warn(`Handled AppError [${error.code}]: ${error.message}`, error.details);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  const errObj = error instanceof Error ? error : new Error(String(error));
  logger.error(defaultMessage, errObj);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: defaultMessage,
      },
    },
    { status: defaultStatus },
  );
}
