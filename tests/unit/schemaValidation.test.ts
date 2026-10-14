import { describe, it, expect } from 'vitest';
import {
  CitizenProfileSchema,
  ExtractedFactsSchema,
} from '@/schemas/citizen';
import {
  SchemeSchema,
  SchemesListSchema,
} from '@/schemas/scheme';
import { RuleDefinitionSchema } from '@/schemas/rules';
import {
  ExtractRequestSchema,
  ExplainRequestSchema,
  DraftRequestSchema,
  ChecklistSaveRequestSchema,
} from '@/schemas/api';
import schemesRaw from '@/../data/schemes.json';

describe('Schema Validation - Schemes & Rules', () => {
  it('strictly validates data/schemes.json against SchemesListSchema', () => {
    const result = SchemesListSchema.safeParse(schemesRaw);
    expect(result.success).toBe(true);
    if (!result.success) {
      console.error(result.error);
    }
    expect(result.data?.length).toBeGreaterThanOrEqual(5);
  });

  it('validates individual scheme fields and required documents', () => {
    const firstScheme = (schemesRaw as unknown[])[0];
    const parsed = SchemeSchema.parse(firstScheme);
    expect(parsed.id).toBeTruthy();
    expect(parsed.official_source_url).toMatch(/^https?:\/\//);
    expect(parsed.required_documents.length).toBeGreaterThan(0);
    expect(parsed.submission_steps.length).toBeGreaterThan(0);
    expect(parsed.office_contact_info.helpline).toBeTruthy();
  });

  it('rejects invalid scheme with missing official_source_url', () => {
    const invalid = {
      id: 'invalid-scheme',
      name: { en: 'A', te: 'B', hi: 'C' },
      description: { en: 'A', te: 'B', hi: 'C' },
      benefit_summary: { en: 'A', te: 'B', hi: 'C' },
      // missing official_source_url
      last_verified_date: '2025-01-01',
      data_status: 'UNVERIFIED',
      verification_notes: 'None',
      eligibility_rules: { type: 'boolean_true', field: 'is_andhra_pradesh_resident' },
      required_documents: [],
      submission_steps: [],
      office_contact_info: { department: 'D', helpline: '100', office_name: 'O' },
    };
    const res = SchemeSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe('Schema Validation - Citizen Profile & Facts', () => {
  it('validates a complete citizen profile', () => {
    const validProfile = {
      age: 48,
      annual_income: 80000,
      land_ownership_acres: 2.5,
      caste_category: 'BC',
      gender: 'FEMALE',
      occupation: 'WEAVER',
      is_andhra_pradesh_resident: true,
      has_white_ration_card: true,
      disability_percentage: 0,
      has_school_going_children: true,
      family_member_count: 4,
    };
    const res = CitizenProfileSchema.safeParse(validProfile);
    expect(res.success).toBe(true);
  });

  it('rejects out-of-range age or invalid caste', () => {
    expect(CitizenProfileSchema.safeParse({ age: 150 }).success).toBe(false);
    expect(CitizenProfileSchema.safeParse({ caste_category: 'UNKNOWN' }).success).toBe(false);
    expect(CitizenProfileSchema.safeParse({ annual_income: -500 }).success).toBe(false);
  });

  it('validates ExtractedFacts with confidence record and follow up question', () => {
    const extracted = {
      profile: {
        age: 62,
        is_andhra_pradesh_resident: true,
      },
      confidence: {
        age: 0.95,
        is_andhra_pradesh_resident: 0.9,
      },
      missing_critical_fields: ['annual_income'],
      follow_up_question: {
        field: 'annual_income',
        question: {
          en: 'What is your total family income per year?',
          te: 'మీ కుటుంబ వార్షిక ఆదాయం ఎంత?',
          hi: 'आपके परिवार की वार्षिक आय कितनी है?',
        },
      },
    };
    const res = ExtractedFactsSchema.safeParse(extracted);
    expect(res.success).toBe(true);
  });
});

describe('Schema Validation - Rules AST', () => {
  it('validates composite rule AST with all and any combinators', () => {
    const compositeRule = {
      type: 'all',
      rules: [
        { type: 'boolean_true', field: 'is_andhra_pradesh_resident' },
        {
          type: 'any',
          rules: [
            { type: 'numeric_min', field: 'age', value: 60 },
            { type: 'numeric_min', field: 'disability_percentage', value: 40 },
          ],
        },
        {
          type: 'one_of',
          field: 'caste_category',
          values: ['SC', 'ST'],
        },
      ],
    };
    const res = RuleDefinitionSchema.safeParse(compositeRule);
    expect(res.success).toBe(true);
  });
});

describe('Schema Validation - API Payloads', () => {
  it('validates ExtractRequestSchema with text input', () => {
    const res = ExtractRequestSchema.safeParse({
      text: 'I am a 62 year old farmer in Guntur with 3 acres land.',
      language: 'en',
    });
    expect(res.success).toBe(true);
  });

  it('rejects ExtractRequestSchema when both text and image are missing', () => {
    const res = ExtractRequestSchema.safeParse({
      language: 'en',
    });
    expect(res.success).toBe(false);
  });

  it('validates ExplainRequestSchema', () => {
    const res = ExplainRequestSchema.safeParse({
      scheme_id: 'ap-ysr-rythu-bharosa',
      language: 'te',
      decision: 'LIKELY_ELIGIBLE',
      matched_rules: ['AP resident', 'Farmer occupation'],
    });
    expect(res.success).toBe(true);
  });

  it('validates DraftRequestSchema', () => {
    const res = DraftRequestSchema.safeParse({
      scheme_id: 'ap-ysr-pension-kanuka',
      language: 'en',
      profile: { age: 65, is_andhra_pradesh_resident: true },
      applicant_name: 'Lakshmi Narayana',
      district: 'Krishna',
    });
    expect(res.success).toBe(true);
  });

  it('validates ChecklistSaveRequestSchema', () => {
    const res = ChecklistSaveRequestSchema.safeParse({
      user_id: 'user-12345',
      scheme_id: 'ap-ysr-aarogyasri',
      checked_document_ids: ['doc-aadhaar'],
    });
    expect(res.success).toBe(true);
  });
});
