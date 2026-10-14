'use client';

import React, { useState, useEffect } from 'react';
import { SupportedLocale } from '@/i18n';
import { Scheme } from '@/schemas/scheme';
import { SchemeEvaluationResult } from '@/services/rules/types';
import { ExtractedFacts, CitizenProfile } from '@/schemas/citizen';
import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { WhyThisMatters } from '@/components/WhyThisMatters';
import { StepIndicator } from '@/components/StepIndicator';
import { StepInput } from '@/components/StepInput';
import { StepExtraction } from '@/components/StepExtraction';
import { StepMatching } from '@/components/StepMatching';

import { UserProfile } from '@/schemas/auth';

export default function Home() {
  const [locale, setLocale] = useState<SupportedLocale>('te');
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [hasUnverified, setHasUnverified] = useState<boolean>(true);
  const [facts, setFacts] = useState<ExtractedFacts | null>(null);
  const [schemeResults, setSchemeResults] = useState<SchemeEvaluationResult[]>([]);

  // Load initial schemes and session on mount
  useEffect(() => {
    async function initData() {
      try {
        const [schemesRes, sessionRes] = await Promise.all([
          fetch('/api/schemes').then((r) => r.json()).catch(() => null),
          fetch('/api/auth/session').then((r) => r.json()).catch(() => null),
        ]);

        if (schemesRes?.ok) {
          setSchemes(schemesRes.data.schemes);
          setHasUnverified(schemesRes.data.has_unverified_schemes);
        }

        if (sessionRes?.ok && sessionRes.data.authenticated) {
          setCurrentUser(sessionRes.data.user);
        }
      } catch {
        // Fallback handled gracefully
      }
    }
    initData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch {
      // ignore
    }
  };

  const handleInputSubmit = async (
    text: string,
    imageBase64?: string,
    imageMime?: 'image/jpeg' | 'image/png' | 'image/webp',
  ) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          image_base64: imageBase64,
          image_mime: imageMime,
          language: locale,
        }),
      });

      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message || 'Extraction failed');
      }

      setFacts(json.data.facts);
      setSchemeResults(json.data.results);
      setHasUnverified(json.data.has_unverified_schemes);

      // Advance to Step 2 (Fact verification & clarification)
      setStep(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmProfile = async (updatedProfile: CitizenProfile) => {
    setIsLoading(true);
    try {
      // Re-evaluate schemes using updated facts
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Updated profile details: Age ${updatedProfile.age || ''}, Occupation ${updatedProfile.occupation || ''}, Resident ${updatedProfile.is_andhra_pradesh_resident ? 'AP' : ''}`,
          language: locale,
          current_profile: updatedProfile,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setFacts(json.data.facts);
        setSchemeResults(json.data.results);
      }
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Banner show={hasUnverified} locale={locale} />
        <Header locale={locale} onLocaleChange={setLocale} currentUser={currentUser} onLogout={handleLogout} />

        <main className="max-w-[960px] mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
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

          {step === 1 && (
            <>
              <WhyThisMatters locale={locale} />
              <StepIndicator currentStep={1} totalSteps={3} locale={locale} />
              <StepInput
                locale={locale}
                onSubmit={handleInputSubmit}
                isLoading={isLoading}
              />
            </>
          )}

          {step === 2 && facts && (
            <>
              <StepIndicator currentStep={2} totalSteps={3} locale={locale} />
              <StepExtraction
                facts={facts}
                locale={locale}
                onConfirm={handleConfirmProfile}
                onBack={() => setStep(1)}
                isUpdating={isLoading}
              />
            </>
          )}

          {step === 3 && facts && (
            <>
              <StepIndicator currentStep={3} totalSteps={3} locale={locale} />
              <StepMatching
                schemes={schemes}
                results={schemeResults}
                profile={facts.profile}
                locale={locale}
                onBackToInput={() => setStep(1)}
              />
            </>
          )}
        </main>
      </div>

      <footer className="w-full bg-brand-surface border-t border-brand-border py-6 px-4 text-center text-xs text-brand-secondary space-y-2 mt-12">
        <p className="font-semibold text-brand-text">
          SevaSetu (సేవాసేతు) — Citizen Engagement and Public Services Platform
        </p>
        <p className="max-w-xl mx-auto">
          SevaSetu is an independent civic information platform designed for low-literacy and vernacular citizens in Andhra Pradesh.
          All eligibility calculations are performed by deterministic code. Never submit personal identification numbers online.
        </p>
        <p className="text-brand-muted">
          Government Portal Source: navasakam.ap.gov.in &middot; ysrrythubharosa.ap.gov.in &middot; sspensions.ap.gov.in &middot; aarogyasri.ap.gov.in
        </p>
      </footer>
    </div>
  );
}
