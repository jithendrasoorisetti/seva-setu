import React from 'react';
import Link from 'next/link';
import { SupportedLocale, getTranslation } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserProfile } from '@/schemas/auth';

interface HeaderProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ locale, onLocaleChange, currentUser, onLogout }) => {
  return (
    <header className="w-full bg-brand-surface border-b border-brand-border py-4 px-4 sm:px-6">
      <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 text-left no-underline hover:opacity-95 transition-opacity">
          <div
            aria-hidden="true"
            className="w-12 h-12 rounded-xl bg-brand-accent flex items-center justify-center text-white font-bold text-2xl shadow-sm"
          >
            సే
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text">
              {getTranslation(locale, 'app_title')}
            </h1>
            <span className="block text-sm sm:text-base text-brand-secondary">
              {getTranslation(locale, 'app_tagline')}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <LanguageSwitcher currentLocale={locale} onLocaleChange={onLocaleChange} />

          {currentUser ? (
            <div className="flex items-center gap-2 bg-brand-elevated border border-brand-border px-3 py-1.5 rounded-full text-xs sm:text-sm">
              <span className="font-semibold text-brand-text">
                {currentUser.role === 'VOLUNTEER' ? '🏛️' : '🧑'} {currentUser.name}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-semibold text-brand-error hover:underline ml-1"
                >
                  {getTranslation(locale, 'nav_logout')}
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              id="header-login-link"
              className="min-h-[44px] px-4 py-2 text-sm font-bold bg-brand-accent text-white rounded-full hover:bg-brand-accent-hover transition-colors flex items-center shadow-sm no-underline"
            >
              🔑 {getTranslation(locale, 'nav_login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
