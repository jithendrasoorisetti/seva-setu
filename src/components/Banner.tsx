import React from 'react';
import { SupportedLocale, getTranslation } from '@/i18n';

interface BannerProps {
  show: boolean;
  locale: SupportedLocale;
}

export const Banner: React.FC<BannerProps> = ({ show, locale }) => {
  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Official Verification Status Notice"
      className="w-full bg-[#8A4B08] text-white px-4 py-3 border-b border-[#6E3C06] text-sm md:text-base font-medium flex items-center justify-center gap-2 text-center"
    >
      <span aria-hidden="true" className="text-lg">⚠️</span>
      <span>{getTranslation(locale, 'unverified_banner')}</span>
    </div>
  );
};
