'use client';

import React, { useState } from 'react';
import { ExtractedFacts, CitizenProfile } from '@/schemas/citizen';
import { SupportedLocale, getTranslation } from '@/i18n';

interface StepExtractionProps {
  facts: ExtractedFacts;
  locale: SupportedLocale;
  onConfirm: (updatedProfile: CitizenProfile) => void;
  onBack: () => void;
  isUpdating: boolean;
}

export const StepExtraction: React.FC<StepExtractionProps> = ({
  facts,
  locale,
  onConfirm,
  onBack,
  isUpdating,
}) => {
  const [profile, setProfile] = useState<CitizenProfile>(facts.profile);
  const [followUpAnswer, setFollowUpAnswer] = useState('');

  const followUp = facts.follow_up_question;

  const handleApplyFollowUp = () => {
    if (!followUp || !followUpAnswer.trim()) return;

    const updated = { ...profile };
    const field = followUp.field;

    if (field === 'age') {
      const num = parseInt(followUpAnswer, 10);
      if (!isNaN(num)) updated.age = num;
    } else if (field === 'occupation') {
      updated.occupation = followUpAnswer.trim().toUpperCase();
    } else if (field === 'is_andhra_pradesh_resident') {
      updated.is_andhra_pradesh_resident = followUpAnswer === 'yes' || followUpAnswer === 'true';
    } else if (field === 'annual_income') {
      const num = parseInt(followUpAnswer, 10);
      if (!isNaN(num)) updated.annual_income = num;
    }

    setProfile(updated);
    onConfirm(updated);
  };

  const fieldsDisplay = [
    { label: getTranslation(locale, 'resident_label'), value: profile.is_andhra_pradesh_resident ? 'Yes (ఆంధ్రప్రదేశ్)' : profile.is_andhra_pradesh_resident === false ? 'No' : 'Not specified', confidence: facts.confidence.is_andhra_pradesh_resident },
    { label: getTranslation(locale, 'age_label'), value: profile.age ? `${profile.age} years` : 'Not specified', confidence: facts.confidence.age },
    { label: getTranslation(locale, 'occupation_label'), value: profile.occupation || 'Not specified', confidence: facts.confidence.occupation },
    { label: getTranslation(locale, 'land_label'), value: profile.land_ownership_acres !== undefined ? `${profile.land_ownership_acres} Acres` : 'None / Not specified', confidence: facts.confidence.land_ownership_acres },
    { label: getTranslation(locale, 'income_label'), value: profile.annual_income ? `₹${profile.annual_income}` : 'Not specified', confidence: facts.confidence.annual_income },
    { label: getTranslation(locale, 'ration_card_label'), value: profile.has_white_ration_card ? 'Yes' : 'Not specified', confidence: facts.confidence.has_white_ration_card },
  ];

  return (
    <div className="w-full bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-8 shadow-sm space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text">
          {getTranslation(locale, 'step_2_title')}
        </h2>
        <p className="text-sm sm:text-base text-brand-secondary">
          We extracted these details from your description. Review them before checking schemes.
        </p>
      </div>

      {/* Prominent Follow-up question if a required fact is missing or low confidence */}
      {followUp && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
            <span aria-hidden="true" className="text-xl">❓</span>
            <span>{getTranslation(locale, 'clarification_title')}</span>
          </div>

          <p className="text-base text-brand-text font-medium">
            {followUp.question[locale] || followUp.question.en}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {followUp.field === 'is_andhra_pradesh_resident' ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const up = { ...profile, is_andhra_pradesh_resident: true };
                    setProfile(up);
                    onConfirm(up);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-brand-accent text-white font-semibold"
                >
                  Yes (అవును)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const up = { ...profile, is_andhra_pradesh_resident: false };
                    setProfile(up);
                    onConfirm(up);
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-brand-elevated border border-brand-border text-brand-text font-semibold"
                >
                  No (కాదు)
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="flex-1 min-h-[48px] px-4 rounded-xl border border-brand-border bg-brand-elevated text-brand-text focus:outline-none focus:border-brand-accent"
                />
                <button
                  type="button"
                  onClick={handleApplyFollowUp}
                  disabled={!followUpAnswer.trim()}
                  className="min-h-[48px] px-5 bg-brand-accent text-white font-semibold rounded-xl hover:bg-brand-accent-hover disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fieldsDisplay.map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-brand-elevated border border-brand-border rounded-xl flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <span className="text-xs text-brand-muted block font-medium">{item.label}</span>
              <span className="text-base font-semibold text-brand-text block">{item.value}</span>
            </div>
            {item.confidence !== undefined && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {Math.round(item.confidence * 100)}% Match
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-border flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] px-6 py-2.5 rounded-xl border border-brand-border bg-brand-elevated text-brand-text font-semibold hover:bg-brand-surface"
        >
          ← Edit Input
        </button>

        <button
          type="button"
          id="confirm-facts-btn"
          onClick={() => onConfirm(profile)}
          disabled={isUpdating}
          className="min-h-[48px] px-6 py-2.5 rounded-xl bg-brand-accent text-white font-bold hover:bg-brand-accent-hover shadow-sm"
        >
          {isUpdating ? getTranslation(locale, 'checking_button') : getTranslation(locale, 'confirm_facts_button')} →
        </button>
      </div>
    </div>
  );
};
