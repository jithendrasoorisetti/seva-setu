import en from './en.json';
import te from './te.json';
import hi from './hi.json';

export type SupportedLocale = 'en' | 'te' | 'hi';

export type MessageKey = keyof typeof en;

export const dictionaries: Record<SupportedLocale, Record<string, string>> = {
  en,
  te,
  hi,
};

export function getTranslation(
  locale: SupportedLocale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] || dictionaries.en;
  let text = dict[key] || dictionaries.en[key] || key;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
    }
  }

  return text;
}
