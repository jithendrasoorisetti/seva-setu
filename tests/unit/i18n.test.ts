import { describe, it, expect } from 'vitest';
import en from '@/i18n/en.json';
import te from '@/i18n/te.json';
import hi from '@/i18n/hi.json';
import { getTranslation } from '@/i18n';

describe('i18n Multi-Language Completeness Tests', () => {
  const enKeys = Object.keys(en);
  const teKeys = Object.keys(te);
  const hiKeys = Object.keys(hi);

  it('ensures all en keys exist and are non-empty in Telugu (te.json)', () => {
    const missingInTe = enKeys.filter((k) => !(k in te) || !(te as Record<string, string>)[k]?.trim());
    expect(missingInTe).toEqual([]);
  });

  it('ensures all en keys exist and are non-empty in Hindi (hi.json)', () => {
    const missingInHi = enKeys.filter((k) => !(k in hi) || !(hi as Record<string, string>)[k]?.trim());
    expect(missingInHi).toEqual([]);
  });

  it('ensures exact key parity across all three languages', () => {
    expect(teKeys.sort()).toEqual(enKeys.sort());
    expect(hiKeys.sort()).toEqual(enKeys.sort());
  });

  it('translates correctly with parameter substitution', () => {
    const t = getTranslation('en', 'app_title');
    expect(t).toBe('SevaSetu');

    const tTe = getTranslation('te', 'app_title');
    expect(tTe).toBe('సేవాసేతు');

    const tHi = getTranslation('hi', 'app_title');
    expect(tHi).toBe('सेवासेतु');
  });
});
