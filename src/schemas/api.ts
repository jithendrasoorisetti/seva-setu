import { z } from 'zod';
import { CitizenProfileSchema } from './citizen';

export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };

export const ExtractRequestSchema = z
  .object({
    text: z.string().max(4000).optional(),
    image_base64: z.string().optional(),
    image_mime: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
    language: z.enum(['en', 'te', 'hi']).default('en'),
    current_profile: CitizenProfileSchema.optional(),
  })
  .refine((data) => !!data.text || !!data.image_base64, {
    message: 'Either text or image_base64 must be provided',
  });
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

export const ExplainRequestSchema = z.object({
  scheme_id: z.string().min(1),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  decision: z.enum(['LIKELY_ELIGIBLE', 'POSSIBLY_ELIGIBLE', 'CHECK_WITH_OFFICE', 'NOT_ELIGIBLE']),
  matched_rules: z.array(z.string()),
  unmatched_rules: z.array(z.string()).default([]),
  missing_facts: z.array(z.string()).default([]),
});
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

export const DraftRequestSchema = z.object({
  scheme_id: z.string().min(1),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  profile: CitizenProfileSchema,
  applicant_name: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  mandal: z.string().max(100).optional(),
  village_ward: z.string().max(100).optional(),
});
export type DraftRequest = z.infer<typeof DraftRequestSchema>;

export const ChecklistSaveRequestSchema = z.object({
  user_id: z.string().min(1).max(128),
  scheme_id: z.string().min(1),
  checked_document_ids: z.array(z.string()),
  profile: CitizenProfileSchema.optional(),
});
export type ChecklistSaveRequest = z.infer<typeof ChecklistSaveRequestSchema>;

export const SttRequestSchema = z.object({
  audio_base64: z.string().min(1),
  language_code: z.enum(['te-IN', 'hi-IN', 'en-IN']).default('te-IN'),
  mime_type: z.string().default('audio/webm'),
});
export type SttRequest = z.infer<typeof SttRequestSchema>;

export const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(4000),
  source_lang: z.enum(['te', 'hi', 'en']).default('te'),
  target_lang: z.enum(['te', 'hi', 'en']).default('en'),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;
