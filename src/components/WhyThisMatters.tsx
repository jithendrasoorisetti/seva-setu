import React from 'react';
import { SupportedLocale, getTranslation } from '@/i18n';

interface WhyThisMattersProps {
  locale: SupportedLocale;
}

export const WhyThisMatters: React.FC<WhyThisMattersProps> = ({ locale }) => {
  return (
    <section
      aria-labelledby="why-matters-heading"
      className="w-full bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-sm my-6"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center font-bold text-xl flex-shrink-0"
        >
          💡
        </div>
        <div className="space-y-3 text-left">
          <h2 id="why-matters-heading" className="text-xl sm:text-2xl font-bold text-brand-text">
            {getTranslation(locale, 'why_matters_title')}
          </h2>
          <p className="text-base sm:text-lg text-brand-secondary leading-relaxed">
            {getTranslation(locale, 'why_matters_desc')}
          </p>

          <ul className="space-y-2 pt-2 text-sm sm:text-base text-brand-secondary">
            <li className="flex items-start gap-2">
              <span className="text-brand-success font-bold" aria-hidden="true">✓</span>
              <span>{getTranslation(locale, 'why_matters_point1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-success font-bold" aria-hidden="true">✓</span>
              <span>{getTranslation(locale, 'why_matters_point2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-success font-bold" aria-hidden="true">✓</span>
              <span>{getTranslation(locale, 'why_matters_point3')}</span>
            </li>
          </ul>

          <div className="pt-2 text-xs sm:text-sm font-medium text-brand-muted border-t border-brand-border/60">
            {getTranslation(locale, 'disclaimer_banner')}
          </div>
        </div>
      </div>
    </section>
  );
};
