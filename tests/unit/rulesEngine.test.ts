import { describe, it, expect } from 'vitest';
import {
  evaluateRule,
  evaluateScheme,
  evaluateAllSchemes,
} from '@/services/rules/engine';
import { RuleDefinition } from '@/schemas/rules';
import { CitizenProfile } from '@/schemas/citizen';
import { Scheme } from '@/schemas/scheme';

describe('Rules Engine - evaluateRule pure function', () => {
  describe('numeric_max', () => {
    const rule: RuleDefinition = {
      type: 'numeric_max',
      field: 'annual_income',
      value: 120000,
      description: 'Annual income must not exceed 120,000',
    };

    it('passes when value is strictly less than max', () => {
      const res = evaluateRule(rule, { annual_income: 100000 });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('passes when value equals max (boundary value)', () => {
      const res = evaluateRule(rule, { annual_income: 120000 });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails when value is just above max', () => {
      const res = evaluateRule(rule, { annual_income: 120001 });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate when fact is missing', () => {
      const res = evaluateRule(rule, {});
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('annual_income');
    });
  });

  describe('numeric_min', () => {
    const rule: RuleDefinition = {
      type: 'numeric_min',
      field: 'age',
      value: 60,
      description: 'Age must be at least 60',
    };

    it('passes when value is strictly greater than min', () => {
      const res = evaluateRule(rule, { age: 65 });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('passes when value equals min (boundary value)', () => {
      const res = evaluateRule(rule, { age: 60 });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails when value is just below min', () => {
      const res = evaluateRule(rule, { age: 59 });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate when age is undefined', () => {
      const res = evaluateRule(rule, {});
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('age');
    });
  });

  describe('equals', () => {
    const rule: RuleDefinition = {
      type: 'equals',
      field: 'occupation',
      value: 'FARMER',
      description: 'Must be a farmer',
    };

    it('passes on exact match', () => {
      const res = evaluateRule(rule, { occupation: 'FARMER' });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('passes on case-insensitive match with whitespace', () => {
      const res = evaluateRule(rule, { occupation: '  farmer  ' });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails on mismatch', () => {
      const res = evaluateRule(rule, { occupation: 'WEAVER' });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate when occupation is missing', () => {
      const res = evaluateRule(rule, {});
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('occupation');
    });
  });

  describe('one_of', () => {
    const rule: RuleDefinition = {
      type: 'one_of',
      field: 'caste_category',
      values: ['SC', 'ST', 'BC', 'MINORITY'],
      description: 'Caste must be SC, ST, BC, or Minority',
    };

    it('passes when value is in the set', () => {
      expect(evaluateRule(rule, { caste_category: 'SC' }).passed).toBe(true);
      expect(evaluateRule(rule, { caste_category: 'BC' }).passed).toBe(true);
    });

    it('fails when value is outside the set', () => {
      const res = evaluateRule(rule, { caste_category: 'OC' });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate when missing', () => {
      const res = evaluateRule(rule, {});
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('caste_category');
    });
  });

  describe('boolean_true', () => {
    const rule: RuleDefinition = {
      type: 'boolean_true',
      field: 'is_andhra_pradesh_resident',
      description: 'Must be AP resident',
    };

    it('passes when true', () => {
      const res = evaluateRule(rule, { is_andhra_pradesh_resident: true });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails when false', () => {
      const res = evaluateRule(rule, { is_andhra_pradesh_resident: false });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('is indeterminate when undefined', () => {
      const res = evaluateRule(rule, {});
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('is_andhra_pradesh_resident');
    });
  });

  describe('all combinator', () => {
    const rule: RuleDefinition = {
      type: 'all',
      rules: [
        { type: 'boolean_true', field: 'is_andhra_pradesh_resident' },
        { type: 'numeric_max', field: 'annual_income', value: 120000 },
      ],
    };

    it('passes when all subrules pass', () => {
      const res = evaluateRule(rule, {
        is_andhra_pradesh_resident: true,
        annual_income: 100000,
      });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails immediately when any subrule explicitly fails', () => {
      const res = evaluateRule(rule, {
        is_andhra_pradesh_resident: true,
        annual_income: 200000, // exceeds max
      });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate if a subrule is missing and none fail', () => {
      const res = evaluateRule(rule, {
        is_andhra_pradesh_resident: true,
      });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
      expect(res.missingField).toBe('annual_income');
    });
  });

  describe('any combinator', () => {
    const rule: RuleDefinition = {
      type: 'any',
      rules: [
        { type: 'numeric_min', field: 'age', value: 60 },
        { type: 'numeric_min', field: 'disability_percentage', value: 40 },
      ],
    };

    it('passes if at least one subrule passes', () => {
      const res = evaluateRule(rule, { age: 65, disability_percentage: 10 });
      expect(res.passed).toBe(true);
      expect(res.isIndeterminate).toBe(false);
    });

    it('fails if all subrules explicitly fail', () => {
      const res = evaluateRule(rule, { age: 45, disability_percentage: 20 });
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(false);
    });

    it('returns indeterminate if none pass but one is missing', () => {
      const res = evaluateRule(rule, { age: 45 }); // age fails, disability missing
      expect(res.passed).toBe(false);
      expect(res.isIndeterminate).toBe(true);
    });

    it('handles unknown rule type gracefully', () => {
      const unknownRule = { type: 'custom_unknown' } as unknown as RuleDefinition;
      const res = evaluateRule(unknownRule, {});
      expect(res.passed).toBe(false);
      expect(res.description).toBe('Unknown rule type');
    });
  });
});

describe('Scheme Evaluation & Priority Ranking', () => {
  const sampleScheme: Scheme = {
    id: 'test-scheme-farmer',
    name: { en: 'Farmer Scheme', te: 'రైతు పథకం', hi: 'किसान योजना' },
    description: { en: 'Farmer aid', te: 'రైతు సాయం', hi: 'किसान सहायता' },
    benefit_summary: { en: 'Cash aid', te: 'నగదు', hi: 'सहायता' },
    official_source_url: 'https://example.com/scheme',
    last_verified_date: '2025-01-01',
    data_status: 'UNVERIFIED',
    verification_notes: 'Test scheme',
    eligibility_rules: {
      type: 'all',
      rules: [
        {
          type: 'boolean_true',
          field: 'is_andhra_pradesh_resident',
          description: 'AP resident',
        },
        {
          type: 'equals',
          field: 'occupation',
          value: 'FARMER',
          description: 'Farmer occupation',
        },
        {
          type: 'numeric_max',
          field: 'land_ownership_acres',
          value: 5,
          description: 'Land max 5 acres',
        },
      ],
    },
    required_documents: [],
    submission_steps: [],
    office_contact_info: {
      department: 'Agri',
      helpline: '1902',
      office_name: 'Sachivalayam',
    },
  };

  it('marks LIKELY_ELIGIBLE when all conditions pass', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      occupation: 'FARMER',
      land_ownership_acres: 3,
    };
    const res = evaluateScheme(sampleScheme, profile);
    expect(res.status).toBe('LIKELY_ELIGIBLE');
    expect(res.score).toBe(1);
    expect(res.matched_rules.length).toBe(3);
  });

  it('marks NOT_ELIGIBLE when hard condition fails', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      occupation: 'FARMER',
      land_ownership_acres: 8, // fails max 5
    };
    const res = evaluateScheme(sampleScheme, profile);
    expect(res.status).toBe('NOT_ELIGIBLE');
    expect(res.unmatched_rules.length).toBeGreaterThan(0);
  });

  it('marks POSSIBLY_ELIGIBLE when key facts match but one secondary fact is missing', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      occupation: 'FARMER',
      // land_ownership_acres is missing
    };
    const res = evaluateScheme(sampleScheme, profile);
    expect(res.status).toBe('POSSIBLY_ELIGIBLE');
    expect(res.missing_facts).toContain('land_ownership_acres');
  });

  it('marks CHECK_WITH_OFFICE when no facts are known', () => {
    const profile: CitizenProfile = {};
    const res = evaluateScheme(sampleScheme, profile);
    expect(res.status).toBe('CHECK_WITH_OFFICE');
  });

  it('correctly sorts multiple schemes by priority', () => {
    const scheme2 = { ...sampleScheme, id: 'scheme-2' };
    const results = evaluateAllSchemes(
      [sampleScheme, scheme2],
      { is_andhra_pradesh_resident: true, occupation: 'FARMER', land_ownership_acres: 2 },
    );
    expect(results[0]?.status).toBe('LIKELY_ELIGIBLE');
  });
});
