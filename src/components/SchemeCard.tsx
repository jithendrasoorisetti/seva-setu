import React from 'react';
import { Scheme } from '@/schemas/scheme';
import { SchemeEvaluationResult, EligibilityStatus } from '@/services/rules/types';
import { SupportedLocale, getTranslation } from '@/i18n';

interface SchemeCardProps {
  scheme: Scheme;
  result: SchemeEvaluationResult;
  locale: SupportedLocale;
  onSelect: (scheme: Scheme, result: SchemeEvaluationResult) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  result,
  locale,
  onSelect,
}) => {
  const schemeName = scheme.name[locale] || scheme.name.en;
  const benefitSummary = scheme.benefit_summary[locale] || scheme.benefit_summary.en;

  const statusConfig: Record<
    EligibilityStatus,
    { label: string; bg: string; text: string; icon: string; border: string }
  > = {
    LIKELY_ELIGIBLE: {
      label: getTranslation(locale, 'status_likely_eligible'),
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      icon: '✓',
    },
    POSSIBLY_ELIGIBLE: {
      label: getTranslation(locale, 'status_possibly_eligible'),
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-800',
      icon: '?',
    },
    CHECK_WITH_OFFICE: {
      label: getTranslation(locale, 'status_check_with_office'),
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      icon: 'ℹ',
    },
    NOT_ELIGIBLE: {
      label: getTranslation(locale, 'status_not_eligible'),
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-700',
      icon: '✕',
    },
  };

  const status = statusConfig[result.status];

  return (
    <article
      aria-labelledby={`scheme-title-${scheme.id}`}
      className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-sm hover:border-brand-accent/50 transition-colors flex flex-col justify-between gap-4 text-left"
    >
      <div className="space-y-3">
        {/* Status chip */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${status.bg} ${status.text} ${status.border}`}
          >
            <span aria-hidden="true" className="font-bold">{status.icon}</span>
            <span>{status.label}</span>
          </span>

          <span className="text-xs font-medium text-brand-muted">
            {getTranslation(locale, 'last_verified_label')}: {scheme.last_verified_date}
          </span>
        </div>

        <h3 id={`scheme-title-${scheme.id}`} className="text-lg sm:text-xl font-bold text-brand-text">
          {schemeName}
        </h3>

        <p className="text-sm sm:text-base text-brand-secondary font-medium">
          💰 {benefitSummary}
        </p>

        {/* Deterministic decision rule reason */}
        <div className="bg-brand-elevated border border-brand-border/70 rounded-xl p-3 text-xs sm:text-sm text-brand-secondary space-y-1">
          <p className="font-semibold text-brand-text">
            {getTranslation(locale, 'decision_reason_label')}:
          </p>
          <p>{result.decision_rule}</p>
        </div>

        {/* Verification banner and link */}
        <div className="text-xs text-brand-muted space-y-1 pt-1 border-t border-brand-border/40">
          <p className="flex items-center gap-1.5">
            <span aria-hidden="true">🏛️</span>
            <span>{getTranslation(locale, 'verify_warning')}</span>
          </p>
          <p>
            <a
              href={scheme.official_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>{getTranslation(locale, 'official_source_label')}:</span>
              <span className="truncate max-w-[200px] sm:max-w-none">{scheme.official_source_url}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>
      </div>

      <button
        type="button"
        id={`view-scheme-btn-${scheme.id}`}
        onClick={() => onSelect(scheme, result)}
        className="w-full min-h-[48px] bg-brand-accent text-white hover:bg-brand-accent-hover font-semibold rounded-xl px-4 py-2.5 transition-colors flex items-center justify-center gap-2"
      >
        <span>{getTranslation(locale, 'view_checklist_button')}</span>
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
};
