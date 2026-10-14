import { describe, it, expect } from 'vitest';
import { SendOtpRequestSchema, LoginRequestSchema } from '@/schemas/auth';

describe('Auth Schemas Unit Tests', () => {
  it('validates correct 10-digit Indian phone numbers', () => {
    const valid = SendOtpRequestSchema.safeParse({ phone: '9876543210' });
    expect(valid.success).toBe(true);

    const valid2 = SendOtpRequestSchema.safeParse({ phone: '6300123456' });
    expect(valid2.success).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    const tooShort = SendOtpRequestSchema.safeParse({ phone: '98765' });
    expect(tooShort.success).toBe(false);

    const invalidStart = SendOtpRequestSchema.safeParse({ phone: '1234567890' });
    expect(invalidStart.success).toBe(false);

    const withChars = SendOtpRequestSchema.safeParse({ phone: '98765abcde' });
    expect(withChars.success).toBe(false);
  });

  it('validates citizen and volunteer login requests', () => {
    const citizenLogin = LoginRequestSchema.safeParse({
      role: 'CITIZEN',
      phone: '9876543210',
      otp: '123456',
    });
    expect(citizenLogin.success).toBe(true);

    const volunteerLogin = LoginRequestSchema.safeParse({
      role: 'VOLUNTEER',
      phone: '9876543211',
      otp: '123456',
      volunteer_id: 'V-AP-GNT-1042',
    });
    expect(volunteerLogin.success).toBe(true);
  });

  it('rejects malformed OTP in login request', () => {
    const shortOtp = LoginRequestSchema.safeParse({
      role: 'CITIZEN',
      phone: '9876543210',
      otp: '123',
    });
    expect(shortOtp.success).toBe(false);

    const alphaOtp = LoginRequestSchema.safeParse({
      role: 'CITIZEN',
      phone: '9876543210',
      otp: 'abcdef',
    });
    expect(alphaOtp.success).toBe(false);
  });
});
