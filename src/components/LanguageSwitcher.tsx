import React from 'react';
import { SupportedLocale } from '@/i18n';

interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale,
  onLocaleChange,
}) => {
  const languages: Array<{ code: SupportedLocale; label: string; name: string }> = [
    { code: 'te', label: 'తెలుగు', name: 'Telugu' },
    { code: 'en', label: 'English', name: 'English' },
    { code: 'hi', label: 'हिंदी', name: 'Hindi' },
  ];

  return (
    <nav
      aria-label="Language selection"
      className="flex items-center gap-2 p-1 bg-brand-surface rounded-full border border-brand-border"
    >
      {languages.map((lang) => {
        const isSelected = currentLocale === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onLocaleChange(lang.code)}
            aria-pressed={isSelected}
            aria-label={`Change language to ${lang.name}`}
            className={`min-h-[44px] px-4 py-2 text-sm md:text-base font-semibold rounded-full transition-colors ${
              isSelected
                ? 'bg-brand-accent text-white shadow-sm'
                : 'text-brand-secondary hover:text-brand-text hover:bg-brand-elevated'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </nav>
  );
};
