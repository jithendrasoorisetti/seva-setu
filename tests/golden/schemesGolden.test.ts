import { describe, it, expect } from 'vitest';
import { getAllSchemes, getSchemeById } from '@/services/data/schemes';
import { evaluateScheme, evaluateAllSchemes } from '@/services/rules/engine';
import { CitizenProfile } from '@/schemas/citizen';

describe('Golden Tests - Welfare Schemes Eligibility Baseline', () => {
  const schemes = getAllSchemes();

  it('verifies dataset has at least 6 schemes loaded', () => {
    expect(schemes.length).toBeGreaterThanOrEqual(6);
  });

  describe('Golden Profile 1: Small Marginal Farmer', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      occupation: 'FARMER',
      land_ownership_acres: 2.5,
      annual_income: 90000,
    };

    it('matches YSR Rythu Bharosa as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-ysr-rythu-bharosa')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
      expect(res.matched_rules.length).toBe(3);
    });

    it('fails YSR Rythu Bharosa when land exceeds 5 acres threshold', () => {
      const scheme = getSchemeById('ap-ysr-rythu-bharosa')!;
      const richFarmer = { ...profile, land_ownership_acres: 12 };
      const res = evaluateScheme(scheme, richFarmer);
      expect(res.status).toBe('NOT_ELIGIBLE');
    });
  });

  describe('Golden Profile 2: Senior Citizen (Pension Kanuka)', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      age: 64,
      annual_income: 60000,
      occupation: 'ELDERLY',
    };

    it('matches YSR Pension Kanuka as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-ysr-pension-kanuka')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });

    it('denies Pension Kanuka if under 60 and not disabled or widow', () => {
      const scheme = getSchemeById('ap-ysr-pension-kanuka')!;
      const youngPerson = { ...profile, age: 35, occupation: 'WORKER', disability_percentage: 0 };
      const res = evaluateScheme(scheme, youngPerson);
      expect(res.status).toBe('NOT_ELIGIBLE');
    });

    it('matches Pension Kanuka for young disabled citizen with >= 40% certificate', () => {
      const scheme = getSchemeById('ap-ysr-pension-kanuka')!;
      const disabledPerson: CitizenProfile = {
        is_andhra_pradesh_resident: true,
        age: 28,
        disability_percentage: 50,
        annual_income: 48000,
      };
      const res = evaluateScheme(scheme, disabledPerson);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });
  });

  describe('Golden Profile 3: BPL Family for Aarogyasri Health Coverage', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      annual_income: 220000,
      has_white_ration_card: true,
    };

    it('matches Dr. YSR Aarogyasri as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-ysr-aarogyasri')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });

    it('denies Aarogyasri if annual income exceeds 500,000 ceiling', () => {
      const scheme = getSchemeById('ap-ysr-aarogyasri')!;
      const highIncome = { ...profile, annual_income: 650000 };
      const res = evaluateScheme(scheme, highIncome);
      expect(res.status).toBe('NOT_ELIGIBLE');
    });
  });

  describe('Golden Profile 4: BC Woman Entrepreneur (Cheyutha)', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      gender: 'FEMALE',
      age: 52,
      caste_category: 'BC',
      annual_income: 75000,
    };

    it('matches YSR Cheyutha as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-ysr-cheyutha')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });

    it('denies Cheyutha if applicant is male', () => {
      const scheme = getSchemeById('ap-ysr-cheyutha')!;
      const maleProfile: CitizenProfile = { ...profile, gender: 'MALE' };
      const res = evaluateScheme(scheme, maleProfile);
      expect(res.status).toBe('NOT_ELIGIBLE');
    });

    it('denies Cheyutha if age is under 45', () => {
      const scheme = getSchemeById('ap-ysr-cheyutha')!;
      const youngWoman: CitizenProfile = { ...profile, age: 38 };
      const res = evaluateScheme(scheme, youngWoman);
      expect(res.status).toBe('NOT_ELIGIBLE');
    });
  });

  describe('Golden Profile 5: Handloom Artisan (Netanna Nestham)', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      occupation: 'WEAVER',
      annual_income: 84000,
    };

    it('matches YSR Netanna Nestham as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-ysr-netanna-nestham')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });
  });

  describe('Golden Profile 6: Mother Sending Children to School (Ammavodi)', () => {
    const profile: CitizenProfile = {
      is_andhra_pradesh_resident: true,
      gender: 'FEMALE',
      has_school_going_children: true,
      annual_income: 80000,
    };

    it('matches Jagananna Ammavodi as LIKELY_ELIGIBLE', () => {
      const scheme = getSchemeById('ap-jagananna-ammavodi')!;
      expect(scheme).toBeDefined();
      const res = evaluateScheme(scheme, profile);
      expect(res.status).toBe('LIKELY_ELIGIBLE');
    });
  });

  describe('Golden Profile 7: Rank Ordering across All Schemes', () => {
    it('prioritizes likely eligible over check with office', () => {
      const weaverProfile: CitizenProfile = {
        is_andhra_pradesh_resident: true,
        occupation: 'WEAVER',
        annual_income: 70000,
      };
      const sorted = evaluateAllSchemes(schemes, weaverProfile);
      expect(sorted[0]?.status).toBe('LIKELY_ELIGIBLE');
      expect(sorted[0]?.scheme_id).toBe('ap-ysr-netanna-nestham');
    });
  });
});
