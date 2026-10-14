import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as sendOtpHandler } from '@/app/api/auth/send-otp/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { GET as sessionHandler } from '@/app/api/auth/session/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';

describe('Authentication API Integration Tests', () => {
  it('sends demo OTP successfully for a valid 10-digit mobile number', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9876543210' }),
    });

    const res = await sendOtpHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.demo_otp).toBe('123456');
    expect(json.data.phone).toContain('XXXXXX');
  });

  it('rejects invalid mobile numbers in send-otp with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '123' }),
    });

    const res = await sendOtpHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('authenticates citizen with demo OTP and sets HttpOnly cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'CITIZEN',
        phone: '9876543210',
        otp: '123456',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.user.role).toBe('CITIZEN');
    expect(json.data.user.district).toBe('Anantapur');

    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toBeTruthy();
    expect(cookieHeader).toContain('sevasetu_session');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=lax');
  });

  it('authenticates volunteer with volunteer ID and cluster code', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'VOLUNTEER',
        phone: '9876543211',
        otp: '123456',
        volunteer_id: 'V-AP-GNT-1042',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.user.role).toBe('VOLUNTEER');
    expect(json.data.user.cluster_id).toBe('V-AP-GNT-1042');
  });

  it('returns unauthenticated when session cookie is absent', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/session');
    const res = await sessionHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.authenticated).toBe(false);
    expect(json.data.user).toBeNull();
  });

  it('clears session cookie on logout', async () => {
    const res = await logoutHandler();
    expect(res.status).toBe(200);

    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toBeTruthy();
    expect(cookieHeader).toContain('Max-Age=0');
  });
});
