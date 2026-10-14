'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SupportedLocale, getTranslation } from '@/i18n';
import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { UserProfile, UserRole } from '@/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLocale>('te');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [phone, setPhone] = useState('');
  const [volunteerId, setVolunteerId] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Check existing session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const json = await res.json();
        if (json.ok && json.data.authenticated) {
          setCurrentUser(json.data.user);
        }
      } catch {
        // graceful ignore
      }
    }
    checkSession();
  }, []);

  const handleSendOtp = async (targetPhone = phone) => {
    if (!/^[6-9]\d{9}$/.test(targetPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message || 'Failed to send OTP');
      }
      setIsOtpSent(true);
      setOtp('123456'); // Pre-fill demo OTP for effortless hackathon judge testing
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent, customPayload?: { role: UserRole; phone: string; otp: string; volunteer_id?: string }) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const payload = customPayload || {
      role,
      phone,
      otp,
      volunteer_id: role === 'VOLUNTEER' ? volunteerId || 'V-AP-GNT-1042' : undefined,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message || 'Login failed');
      }

      setSuccessMsg(getTranslation(locale, 'login_success_msg'));
      setCurrentUser(json.data.user);
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (selectedRole: UserRole) => {
    if (selectedRole === 'CITIZEN') {
      setRole('CITIZEN');
      setPhone('9876543210');
      setOtp('123456');
      setIsOtpSent(true);
      handleLogin(undefined, {
        role: 'CITIZEN',
        phone: '9876543210',
        otp: '123456',
      });
    } else {
      setRole('VOLUNTEER');
      setPhone('9876543211');
      setVolunteerId('V-AP-GNT-1042');
      setOtp('123456');
      setIsOtpSent(true);
      handleLogin(undefined, {
        role: 'VOLUNTEER',
        phone: '9876543211',
        otp: '123456',
        volunteer_id: 'V-AP-GNT-1042',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setSuccessMsg(null);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-base">
      <div>
        <Banner show={true} locale={locale} />
        <Header locale={locale} onLocaleChange={setLocale} currentUser={currentUser} onLogout={handleLogout} />

        <main className="max-w-[560px] mx-auto w-full px-4 sm:px-6 py-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:text-brand-accent-hover transition-colors"
            >
              {getTranslation(locale, 'back_to_home')}
            </Link>
          </div>

          <div className="w-full bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
            {/* Page Title & Heading */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-text">
                {getTranslation(locale, 'login_title')}
              </h2>
              <p className="text-sm sm:text-base text-brand-secondary leading-relaxed">
                {getTranslation(locale, 'login_desc')}
              </p>
            </div>

            {/* Error or Success Alert */}
            {errorMsg && (
              <div
                role="alert"
                className="bg-brand-error/10 border border-brand-error rounded-xl p-4 text-brand-error text-sm font-semibold flex items-center justify-between"
              >
                <span>⚠️ {errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  aria-label="Dismiss error message"
                  className="text-brand-error font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="bg-brand-success/10 border border-brand-success rounded-xl p-4 text-brand-success text-sm font-semibold flex items-center gap-2"
              >
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {currentUser ? (
              <div className="bg-brand-elevated border border-brand-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-accent/10 text-brand-accent font-bold flex items-center justify-center text-xl">
                    {currentUser.role === 'VOLUNTEER' ? '🏛️' : '🧑'}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-brand-text">{currentUser.name}</h2>
                    <p className="text-xs text-brand-secondary">
                      {currentUser.role === 'VOLUNTEER' ? 'Grama Sachivalayam Volunteer' : 'Citizen'} &middot; {currentUser.district}
                    </p>
                    <p className="text-xs font-mono text-brand-muted">{currentUser.masked_phone}</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/"
                    className="min-h-[44px] flex-1 bg-brand-accent text-white font-semibold rounded-xl flex items-center justify-center text-sm px-4"
                  >
                    Go to Navigator →
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[44px] px-4 border border-brand-border bg-brand-surface text-brand-secondary hover:text-brand-text font-semibold rounded-xl text-sm"
                  >
                    {getTranslation(locale, 'nav_logout')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1-Click Demo Logins for Instant Testing */}
                <div className="space-y-2 border-b border-brand-border/60 pb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                    {getTranslation(locale, 'login_demo_title')}
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      id="demo-citizen-btn"
                      onClick={() => handleQuickDemo('CITIZEN')}
                      disabled={isLoading}
                      className="min-h-[44px] px-4 py-2.5 text-left text-sm bg-brand-elevated border border-brand-border hover:border-brand-accent rounded-xl text-brand-text font-medium transition-colors flex items-center justify-between"
                    >
                      <span>{getTranslation(locale, 'login_demo_citizen')}</span>
                      <span className="text-xs text-brand-accent font-bold">1-Click Login →</span>
                    </button>

                    <button
                      type="button"
                      id="demo-volunteer-btn"
                      onClick={() => handleQuickDemo('VOLUNTEER')}
                      disabled={isLoading}
                      className="min-h-[44px] px-4 py-2.5 text-left text-sm bg-brand-elevated border border-brand-border hover:border-brand-accent rounded-xl text-brand-text font-medium transition-colors flex items-center justify-between"
                    >
                      <span>{getTranslation(locale, 'login_demo_volunteer')}</span>
                      <span className="text-xs text-brand-accent font-bold">1-Click Login →</span>
                    </button>
                  </div>
                </div>

                {/* Role Tabs */}
                <div
                  role="tablist"
                  aria-label="Login user type"
                  className="flex border-b border-brand-border gap-4"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-citizen"
                    aria-selected={role === 'CITIZEN'}
                    aria-controls="panel-login-form"
                    onClick={() => {
                      setRole('CITIZEN');
                      setIsOtpSent(false);
                      setOtp('');
                    }}
                    className={`min-h-[44px] pb-3 text-sm sm:text-base font-bold border-b-2 transition-colors ${
                      role === 'CITIZEN'
                        ? 'border-brand-accent text-brand-accent'
                        : 'border-transparent text-brand-secondary hover:text-brand-text'
                    }`}
                  >
                    {getTranslation(locale, 'login_tab_citizen')}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="tab-volunteer"
                    aria-selected={role === 'VOLUNTEER'}
                    aria-controls="panel-login-form"
                    onClick={() => {
                      setRole('VOLUNTEER');
                      setIsOtpSent(false);
                      setOtp('');
                    }}
                    className={`min-h-[44px] pb-3 text-sm sm:text-base font-bold border-b-2 transition-colors ${
                      role === 'VOLUNTEER'
                        ? 'border-brand-accent text-brand-accent'
                        : 'border-transparent text-brand-secondary hover:text-brand-text'
                    }`}
                  >
                    {getTranslation(locale, 'login_tab_volunteer')}
                  </button>
                </div>

                {/* Login Form */}
                <form
                  id="panel-login-form"
                  role="tabpanel"
                  aria-labelledby={role === 'CITIZEN' ? 'tab-citizen' : 'tab-volunteer'}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {role === 'VOLUNTEER' && (
                    <div>
                      <label
                        htmlFor="volunteer-id-input"
                        className="block text-sm font-semibold text-brand-text mb-1"
                      >
                        {getTranslation(locale, 'login_volunteer_id_label')}
                      </label>
                      <input
                        id="volunteer-id-input"
                        type="text"
                        value={volunteerId}
                        onChange={(e) => setVolunteerId(e.target.value)}
                        placeholder={getTranslation(locale, 'login_volunteer_id_placeholder')}
                        className="w-full min-h-[44px] p-3 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="mobile-input"
                      className="block text-sm font-semibold text-brand-text mb-1"
                    >
                      {getTranslation(locale, 'login_phone_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="mobile-input"
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder={getTranslation(locale, 'login_phone_placeholder')}
                        className="flex-1 min-h-[44px] p-3 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        id="send-otp-btn"
                        onClick={() => handleSendOtp()}
                        disabled={isLoading || phone.length !== 10}
                        className="min-h-[44px] px-4 bg-brand-accent text-white font-semibold rounded-xl text-sm hover:bg-brand-accent-hover disabled:opacity-40 transition-colors"
                      >
                        {isOtpSent ? getTranslation(locale, 'login_resend_otp') : getTranslation(locale, 'login_send_otp_btn')}
                      </button>
                    </div>
                  </div>

                  {isOtpSent && (
                    <div className="space-y-2 pt-1">
                      <div
                        id="otp-sent-status"
                        aria-live="polite"
                        className="text-xs font-semibold text-brand-success bg-brand-success/10 p-2.5 rounded-lg border border-brand-success/20"
                      >
                        {getTranslation(locale, 'login_otp_sent_notice')}
                      </div>

                      <div>
                        <label
                          htmlFor="otp-input"
                          className="block text-sm font-semibold text-brand-text mb-1"
                        >
                          {getTranslation(locale, 'login_otp_label')}
                        </label>
                        <input
                          id="otp-input"
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder={getTranslation(locale, 'login_otp_placeholder')}
                          className="w-full min-h-[44px] p-3 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none tracking-widest font-mono text-center text-lg"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={isLoading || !isOtpSent || otp.length !== 6}
                    className="w-full min-h-[48px] bg-brand-accent text-white hover:bg-brand-accent-hover disabled:opacity-40 font-bold rounded-xl px-6 py-3 text-base transition-colors flex items-center justify-center gap-2 shadow-sm mt-4"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      <span>{getTranslation(locale, 'login_verify_btn')} →</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </main>
      </div>

      <footer className="w-full bg-brand-surface border-t border-brand-border py-6 px-4 text-center text-xs text-brand-secondary space-y-1">
        <p className="font-semibold text-brand-text">
          SevaSetu (సేవాసేతు) — Citizen Engagement and Public Services Platform
        </p>
        <p className="text-brand-muted">
          Secure, zero-PII session. Mobile numbers are encrypted and masked at all times.
        </p>
      </footer>
    </div>
  );
}
