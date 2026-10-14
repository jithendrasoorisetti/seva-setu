import { z } from 'zod';

export const CasteCategoryEnum = z.enum(['OC', 'BC', 'SC', 'ST', 'MINORITY']);
export type CasteCategory = z.infer<typeof CasteCategoryEnum>;

export const GenderEnum = z.enum(['FEMALE', 'MALE', 'OTHER']);
export type Gender = z.infer<typeof GenderEnum>;

export const CitizenProfileSchema = z.object({
  age: z.number().int().min(0).max(125).optional(),
  annual_income: z.number().min(0).optional(),
  land_ownership_acres: z.number().min(0).optional(),
  caste_category: CasteCategoryEnum.optional(),
  gender: GenderEnum.optional(),
  occupation: z.string().optional(),
  is_andhra_pradesh_resident: z.boolean().optional(),
  has_white_ration_card: z.boolean().optional(),
  disability_percentage: z.number().min(0).max(100).optional(),
  has_school_going_children: z.boolean().optional(),
  family_member_count: z.number().int().min(1).optional(),
});

export type CitizenProfile = z.infer<typeof CitizenProfileSchema>;

export const LocalizedTextSchema = z.object({
  en: z.string(),
  te: z.string(),
  hi: z.string(),
});
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const FollowUpQuestionSchema = z.object({
  field: z.string(),
  question: LocalizedTextSchema,
  options: z.array(z.string()).optional(),
});
export type FollowUpQuestion = z.infer<typeof FollowUpQuestionSchema>;

export const ExtractedFactsSchema = z.object({
  profile: CitizenProfileSchema,
  confidence: z.record(z.string(), z.number().min(0).max(1)),
  missing_critical_fields: z.array(z.string()),
  follow_up_question: FollowUpQuestionSchema.nullable().optional(),
});

export type ExtractedFacts = z.infer<typeof ExtractedFactsSchema>;
