'use client';

import React, { useState, useEffect } from 'react';
import { Scheme } from '@/schemas/scheme';
import { SchemeEvaluationResult } from '@/services/rules/types';
import { CitizenProfile } from '@/schemas/citizen';
import { SupportedLocale, getTranslation } from '@/i18n';
import { DocumentChecklist } from './DocumentChecklist';
import { DraftApplication } from './DraftApplication';

interface SchemeDetailModalProps {
  scheme: Scheme;
  result: SchemeEvaluationResult;
  profile: CitizenProfile;
  locale: SupportedLocale;
  onClose: () => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({
  scheme,
  result,
  profile,
  locale,
  onClose,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(true);

  const schemeName = scheme.name[locale] || scheme.name.en;

  useEffect(() => {
    let isCancelled = false;

    async function fetchExplanation() {
      setIsLoadingExplanation(true);
      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            scheme_id: scheme.id,
            language: locale,
            decision: result.status,
            matched_rules: result.matched_rules,
            unmatched_rules: result.unmatched_rules,
            missing_facts: result.missing_facts,
          }),
        });

        if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done || isCancelled) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.chunk) {
                    accumulated += parsed.chunk;
                    setExplanation(accumulated);
                  }
                } catch {
                  // ignore partial json
                }
              }
            }
          }
        } else {
          const json = await res.json();
          if (!isCancelled && json.ok) {
            setExplanation(json.data.explanation);
          }
        }
      } catch {
        if (!isCancelled) {
          setExplanation(`Guidance for ${schemeName}: ${result.decision_rule}. Please confirm with your local Grama Sachivalayam.`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingExplanation(false);
        }
      }
    }

    fetchExplanation();

    // Listen for Escape key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isCancelled = true;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scheme, result, locale, schemeName, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-scheme-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-start justify-center p-3 sm:p-6"
    >
      <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-[800px] w-full my-6 p-5 sm:p-8 shadow-xl text-left space-y-6 relative">
        {/* Close button */}
        <div className="flex items-center justify-between gap-4 border-b border-brand-border pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Scheme Guide & Application
            </span>
            <h2 id="modal-scheme-title" className="text-xl sm:text-2xl font-bold text-brand-text">
              {schemeName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-brand-elevated border border-brand-border text-brand-secondary hover:text-brand-text flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Verification banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <span aria-hidden="true" className="text-base">⚠️</span>
          <div>
            <p className="font-semibold">{getTranslation(locale, 'verify_warning')}</p>
            <p>
              Official website:{' '}
              <a
                href={scheme.official_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-brand-accent"
              >
                {scheme.official_source_url} ↗
              </a>{' '}
              (Last checked: {scheme.last_verified_date})
            </p>
          </div>
        </div>

        {/* Streamed Plain-language Explanation */}
        <div className="bg-brand-elevated border border-brand-border rounded-2xl p-5 space-y-2">
          <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
            <span>💡</span>
            <span>{getTranslation(locale, 'step_4_title')}</span>
          </h3>

          <div aria-live="polite" className="text-base text-brand-secondary leading-relaxed">
            {isLoadingExplanation && !explanation ? (
              <p className="text-brand-muted animate-pulse">
                {getTranslation(locale, 'checking_button')}
              </p>
            ) : (
              <p className="whitespace-pre-line">{explanation}</p>
            )}
          </div>
        </div>

        {/* Document Checklist */}
        <div className="border-t border-brand-border pt-4">
          <DocumentChecklist
            documents={scheme.required_documents}
            schemeId={scheme.id}
            locale={locale}
          />
        </div>

        {/* Step-by-Step Submission Guide */}
        <div className="border-t border-brand-border pt-4 space-y-3">
          <h3 className="text-lg font-bold text-brand-text">
            {getTranslation(locale, 'steps_title')}
          </h3>

          <div className="space-y-3">
            {scheme.submission_steps.map((step) => (
              <div
                key={step.step_number}
                className="bg-brand-elevated border border-brand-border rounded-xl p-4 space-y-1"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-brand-text">
                  <span className="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-xs">
                    {step.step_number}
                  </span>
                  <span>{step.title[locale] || step.title.en}</span>
                </div>
                <p className="text-sm text-brand-secondary pl-8">
                  {step.instructions[locale] || step.instructions.en}
                </p>
                <p className="text-xs font-semibold text-brand-muted pl-8 pt-1">
                  🏛️ Office: {step.office}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Office Contact */}
        <div className="border-t border-brand-border pt-4 space-y-2 text-xs sm:text-sm text-brand-secondary bg-brand-elevated p-4 rounded-xl border">
          <h3 className="font-bold text-brand-text">{getTranslation(locale, 'contact_title')}</h3>
          <p>🏢 Department: {scheme.office_contact_info.department}</p>
          <p>📞 Helpline: <span className="font-bold text-brand-text">{scheme.office_contact_info.helpline}</span> (Toll-Free)</p>
          <p>📍 Office: {scheme.office_contact_info.office_name}</p>
        </div>

        {/* Pre-filled Draft Application */}
        <div className="border-t border-brand-border pt-4">
          <DraftApplication scheme={scheme} profile={profile} locale={locale} />
        </div>

        {/* Footer actions */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            id="modal-close-btn"
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 bg-brand-elevated border border-brand-border hover:bg-brand-surface rounded-xl font-semibold text-brand-text"
          >
            {getTranslation(locale, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
};
