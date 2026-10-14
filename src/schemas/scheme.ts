import { z } from 'zod';
import { RuleDefinitionSchema } from './rules';
import { LocalizedTextSchema } from './citizen';

export const SchemeDocumentSchema = z.object({
  id: z.string(),
  name: LocalizedTextSchema,
  purpose: LocalizedTextSchema,
  is_mandatory: z.boolean(),
});
export type SchemeDocument = z.infer<typeof SchemeDocumentSchema>;

export const SchemeSubmissionStepSchema = z.object({
  step_number: z.number().int().min(1),
  title: LocalizedTextSchema,
  instructions: LocalizedTextSchema,
  office: z.string(),
});
export type SchemeSubmissionStep = z.infer<typeof SchemeSubmissionStepSchema>;

export const SchemeContactInfoSchema = z.object({
  department: z.string(),
  helpline: z.string(),
  office_name: z.string(),
});
export type SchemeContactInfo = z.infer<typeof SchemeContactInfoSchema>;

export const DataStatusEnum = z.enum(['VERIFIED', 'UNVERIFIED']);
export type DataStatus = z.infer<typeof DataStatusEnum>;

export const SchemeSchema = z.object({
  id: z.string().min(1),
  name: LocalizedTextSchema,
  description: LocalizedTextSchema,
  benefit_summary: LocalizedTextSchema,
  official_source_url: z.string().url(),
  last_verified_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_status: DataStatusEnum,
  verification_notes: z.string(),
  eligibility_rules: RuleDefinitionSchema,
  required_documents: z.array(SchemeDocumentSchema),
  submission_steps: z.array(SchemeSubmissionStepSchema),
  office_contact_info: SchemeContactInfoSchema,
});

export type Scheme = z.infer<typeof SchemeSchema>;

export const SchemesListSchema = z.array(SchemeSchema).min(5).max(12);
