import { describe, it, expect } from 'vitest';
import { redactSensitiveData, redactObject } from '@/lib/redactor';

describe('Redactor Unit Tests', () => {
  it('masks 12-digit Aadhaar number with spaces', () => {
    const input = 'My Aadhaar number is 5432 1098 7654 for verification.';
    const output = redactSensitiveData(input);
    expect(output).not.toContain('5432');
    expect(output).not.toContain('1098');
    expect(output).toContain('[REDACTED-ID-XXXX-XXXX-7654]');
  });

  it('masks 12-digit Aadhaar number with hyphens', () => {
    const input = 'Citizen card: 9876-5432-1098.';
    const output = redactSensitiveData(input);
    expect(output).not.toContain('9876');
    expect(output).toContain('[REDACTED-ID-XXXX-XXXX-1098]');
  });

  it('masks contiguous 12-digit Aadhaar number', () => {
    const input = 'Record 123456789012 confirmed';
    const output = redactSensitiveData(input);
    expect(output).not.toContain('123456789012');
    expect(output).toContain('[REDACTED-ID-XXXX-XXXX-9012]');
  });

  it('masks Indian PAN cards', () => {
    const input = 'Applicant PAN is ABCDE1234F for income verification';
    const output = redactSensitiveData(input);
    expect(output).not.toContain('ABCDE1234F');
    expect(output).toContain('[REDACTED-PAN]');
  });

  it('masks 10-digit mobile phone numbers', () => {
    const input = 'Call 9876543210 or +91 9123456789 for help';
    const output = redactSensitiveData(input);
    expect(output).not.toContain('9876543210');
    expect(output).toContain('[REDACTED-PHONE-XXX-210]');
  });

  it('does not mask safe normal numbers like years, acres, or small amounts', () => {
    const input = 'Age 62, 3 acres land, income 120000 rupees, year 2025';
    const output = redactSensitiveData(input);
    expect(output).toBe('Age 62, 3 acres land, income 120000 rupees, year 2025');
  });

  it('recursively redacts nested objects and arrays without mutating original', () => {
    const data = {
      user: {
        name: 'Venkata Rao',
        aadhaar: '4567 8901 2345',
        documents: ['PAN ABCDE5678Z', 'Phone 9876543210'],
      },
      amount: 15000,
    };

    const redacted = redactObject(data);
    expect(redacted.user.name).toBe('Venkata Rao');
    expect(redacted.user.aadhaar).toContain('[REDACTED-ID-XXXX-XXXX-2345]');
    expect(redacted.user.documents[0]).toContain('[REDACTED-PAN]');
    expect(redacted.amount).toBe(15000);
  });
});
