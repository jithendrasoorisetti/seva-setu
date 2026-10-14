'use client';

import React, { useState } from 'react';
import { SupportedLocale, getTranslation } from '@/i18n';
import { VoiceInput } from './VoiceInput';
import { ImageUploader } from './ImageUploader';

interface StepInputProps {
  locale: SupportedLocale;
  onSubmit: (text: string, imageBase64?: string, imageMime?: 'image/jpeg' | 'image/png' | 'image/webp') => void;
  isLoading: boolean;
}

export const StepInput: React.FC<StepInputProps> = ({ locale, onSubmit, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageMime, setImageMime] = useState<'image/jpeg' | 'image/png' | 'image/webp' | undefined>(undefined);

  const sampleProfiles: Array<{ label: string; text: Record<SupportedLocale, string> }> = [
    {
      label: '🌾 Small Farmer (రైతు)',
      text: {
        en: 'I am a 56 year old farmer living in Guntur Andhra Pradesh with 2.5 acres of land and a white ration card.',
        te: 'నేను గుంటూరు జిల్లాలో నివసిస్తున్న 56 ఏళ్ల రైతును. నాకు 2.5 ఎకరాల పొలం మరియు తెల్ల రేషన్ కార్డు ఉన్నాయి.',
        hi: 'मैं गुंटूर आंध्र प्रदेश का 56 वर्षीय किसान हूँ। मेरे पास 2.5 एकड़ जमीन और सफेद राशन कार्ड है।',
      },
    },
    {
      label: '👵 Senior Citizen (వృద్ధాప్య పింఛను)',
      text: {
        en: 'I am a 64 year old woman living in Vijayawada Andhra Pradesh with annual income 50000 rupees and a white ration card.',
        te: 'నేను విజయవాడలో నివసించే 64 ఏళ్ల మహిళను. వార్షిక ఆదాయం ₹50,000 మరియు రైస్ కార్డు కలదు.',
        hi: 'मैं विजयवाड़ा की 64 वर्षीय महिला हूँ। वार्षिक आय ₹50,000 और सफेद राशन कार्ड है।',
      },
    },
    {
      label: '🧵 Handloom Weaver (చేనేత కార్మికుడు)',
      text: {
        en: 'I am a handloom weaver from Dharmavaram AP with working loom and annual household income 80000.',
        te: 'నేను ధర్మవరానికి చెందిన చేనేత కార్మికుడిని. నాకు సొంత మగ్గం ఉంది మరియు వార్షిక ఆదాయం ₹80,000.',
        hi: 'मैं धर्मावरम का हथकरघा बुनकर हूँ। मेरे पास चालू करघा है और वार्षिक आय ₹80,000 है।',
      },
    },
  ];

  const handleVoiceTranscript = (text: string) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBase64) return;
    onSubmit(inputText.trim(), imageBase64, imageMime);
  };

  return (
    <div className="w-full bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-8 shadow-sm space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text">
          {getTranslation(locale, 'step_1_title')}
        </h2>
        <p className="text-sm sm:text-base text-brand-secondary">
          Speak in Telugu or Hindi, type your situation, or upload a photo of a notice.
        </p>
      </div>

      {/* Voice Input Button */}
      <div className="border-b border-brand-border/60 pb-4">
        <VoiceInput locale={locale} onTranscript={handleVoiceTranscript} />
      </div>

      {/* Quick sample chips for one-click testing */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Quick test profiles (ఒక్క క్లిక్‌తో ప్రయత్నించండి):
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleProfiles.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(sample.text[locale] || sample.text.en)}
              className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm bg-brand-elevated border border-brand-border hover:border-brand-accent rounded-full text-brand-text font-medium transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="situation-input"
            className="block text-sm sm:text-base font-semibold text-brand-text mb-2"
          >
            {getTranslation(locale, 'input_label')}
          </label>
          <textarea
            id="situation-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={getTranslation(locale, 'input_placeholder')}
            className="w-full p-4 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base leading-relaxed focus:border-brand-accent focus:outline-none resize-y"
          />
        </div>

        {/* Photo Uploader */}
        <div className="border-t border-brand-border/60 pt-4">
          <ImageUploader
            locale={locale}
            onImageSelected={(base64, mime) => {
              setImageBase64(base64);
              setImageMime(mime);
            }}
            onImageRemoved={() => {
              setImageBase64(undefined);
              setImageMime(undefined);
            }}
          />
        </div>

        <button
          type="submit"
          id="submit-situation-btn"
          disabled={isLoading || (!inputText.trim() && !imageBase64)}
          className="w-full min-h-[48px] bg-brand-accent text-white hover:bg-brand-accent-hover disabled:opacity-40 font-bold rounded-xl px-6 py-3.5 text-base sm:text-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{getTranslation(locale, 'checking_button')}</span>
            </span>
          ) : (
            <span>{getTranslation(locale, 'submit_button')} →</span>
          )}
        </button>
      </form>
    </div>
  );
};
