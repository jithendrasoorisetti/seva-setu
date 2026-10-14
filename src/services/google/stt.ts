import { logger } from '@/lib/logger';

export interface TranscribeResult {
  text: string;
  source: 'google-cloud-stt' | 'fallback-empty';
  language: string;
}

/**
 * Transcribes audio buffer via Google Cloud Speech-to-Text API.
 * Feature-flagged via process.env.ENABLE_SPEECH_TO_TEXT.
 */
export async function transcribeAudio(
  audioBase64: string,
  languageCode = 'te-IN',
): Promise<TranscribeResult> {
  const isEnabled = process.env.ENABLE_SPEECH_TO_TEXT === 'true';

  if (!isEnabled) {
    logger.info('Google Cloud STT feature flag is OFF. Using client-side speech or manual typing.');
    return {
      text: '',
      source: 'fallback-empty',
      language: languageCode,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY; // Google Cloud API key
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    logger.warn('Google Cloud credentials missing for STT');
    return {
      text: '',
      source: 'fallback-empty',
      language: languageCode,
    };
  }

  try {
    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    const payload = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode,
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioBase64,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error('Google Cloud STT HTTP error', errText);
      return { text: '', source: 'fallback-empty', language: languageCode };
    }

    const data = await res.json();
    const transcript =
      data.results
        ?.map((r: { alternatives?: Array<{ transcript?: string }> }) => r.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim() || '';

    return {
      text: transcript,
      source: 'google-cloud-stt',
      language: languageCode,
    };
  } catch (err) {
    logger.error('Google Cloud STT execution error', err);
    return { text: '', source: 'fallback-empty', language: languageCode };
  }
}
