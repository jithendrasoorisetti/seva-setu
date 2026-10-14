'use client';

import React, { useState } from 'react';
import { Scheme } from '@/schemas/scheme';
import { SchemeEvaluationResult } from '@/services/rules/types';
import { CitizenProfile } from '@/schemas/citizen';
import { SupportedLocale, getTranslation } from '@/i18n';
import { SchemeCard } from './SchemeCard';
import { SchemeDetailModal } from './SchemeDetailModal';

interface StepMatchingProps {
  schemes: Scheme[];
  results: SchemeEvaluationResult[];
  profile: CitizenProfile;
  locale: SupportedLocale;
  onBackToInput: () => void;
}

export const StepMatching: React.FC<StepMatchingProps> = ({
  schemes,
  results,
  profile,
  locale,
  onBackToInput,
}) => {
  const [selectedScheme, setSelectedScheme] = useState<{
    scheme: Scheme;
    result: SchemeEvaluationResult;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filteredResults = results.filter((res) => {
    if (activeFilter === 'ALL') return true;
    return res.status === activeFilter;
  });

  const getScheme = (id: string) => schemes.find((s) => s.id === id);

  return (
    <div className="w-full space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-text">
            {getTranslation(locale, 'step_3_title')}
          </h2>
          <p className="text-sm sm:text-base text-brand-secondary">
            Deterministic eligibility evaluated against official Andhra Pradesh welfare rules.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToInput}
          className="min-h-[44px] px-4 py-2 border border-brand-border bg-brand-surface rounded-xl font-semibold text-sm text-brand-text hover:bg-brand-elevated self-start sm:self-auto"
        >
          ← {getTranslation(locale, 'back_to_results')}
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {[
          { id: 'ALL', label: 'All Schemes' },
          { id: 'LIKELY_ELIGIBLE', label: getTranslation(locale, 'status_likely_eligible') },
          { id: 'POSSIBLY_ELIGIBLE', label: getTranslation(locale, 'status_possibly_eligible') },
          { id: 'CHECK_WITH_OFFICE', label: getTranslation(locale, 'status_check_with_office') },
        ].map((chip) => {
          const isSelected = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveFilter(chip.id)}
              aria-pressed={isSelected}
              className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-full border transition-colors whitespace-nowrap ${
                isSelected
                  ? 'bg-brand-accent text-white border-brand-accent shadow-sm'
                  : 'bg-brand-surface border-brand-border text-brand-secondary hover:text-brand-text'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredResults.map((item) => {
          const scheme = getScheme(item.scheme_id);
          if (!scheme) return null;

          return (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              result={item}
              locale={locale}
              onSelect={(s, r) => setSelectedScheme({ scheme: s, result: r })}
            />
          );
        })}
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <SchemeDetailModal
          scheme={selectedScheme.scheme}
          result={selectedScheme.result}
          profile={profile}
          locale={locale}
          onClose={() => setSelectedScheme(null)}
        />
      )}
    </div>
  );
};
