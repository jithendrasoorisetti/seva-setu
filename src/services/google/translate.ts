import { logger } from '@/lib/logger';

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  source: 'google-cloud-translation' | 'fallback-identity';
}

/**
 * Translates text using Google Cloud Translation API.
 * Feature-flagged via process.env.ENABLE_TRANSLATION.
 */
export async function translateText(
  text: string,
  sourceLang = 'te',
  targetLang = 'en',
): Promise<TranslationResult> {
  const isEnabled = process.env.ENABLE_TRANSLATION === 'true';

  if (!isEnabled) {
    logger.info('Google Cloud Translation flag is OFF. Using direct multi-lingual extraction.');
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      source: 'fallback-identity',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    logger.warn('Google Cloud credentials missing for Translation');
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      source: 'fallback-identity',
    };
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('Google Cloud Translation HTTP error', errText);
      return { translatedText: text, sourceLang, targetLang, source: 'fallback-identity' };
    }

    const data = await res.json();
    const translated = data.data?.translations?.[0]?.translatedText || text;

    return {
      translatedText: translated,
      sourceLang,
      targetLang,
      source: 'google-cloud-translation',
    };
  } catch (err) {
    logger.error('Google Cloud Translation error', err);
    return { translatedText: text, sourceLang, targetLang, source: 'fallback-identity' };
  }
}
