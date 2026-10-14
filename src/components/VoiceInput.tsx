'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SupportedLocale, getTranslation } from '@/i18n';

interface VoiceInputProps {
  locale: SupportedLocale;
  onTranscript: (text: string) => void;
}

// Window speech recognition typings
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ locale, onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser SpeechRecognition API
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => IWindowSpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => IWindowSpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<SupportedLocale, string> = {
        te: 'te-IN',
        hi: 'hi-IN',
        en: 'en-IN',
      };
      recognition.lang = langMap[locale] || 'en-IN';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item?.[0]) {
            finalTranscript += item[0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechStatus('Voice recognition paused or stopped.');
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechStatus('Voice input finished.');
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [locale, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setIsListening(!isListening);
      if (!isListening) {
        setSpeechStatus(getTranslation(locale, 'voice_btn_listening'));
      } else {
        setSpeechStatus(getTranslation(locale, 'voice_btn_stop'));
      }
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setSpeechStatus(getTranslation(locale, 'voice_btn_stop'));
    } else {
      const langMap: Record<SupportedLocale, string> = {
        te: 'te-IN',
        hi: 'hi-IN',
        en: 'en-IN',
      };
      recognitionRef.current.lang = langMap[locale] || 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
      setSpeechStatus(getTranslation(locale, 'voice_btn_listening'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full my-2">
      <button
        type="button"
        id="voice-input-btn"
        onClick={toggleListening}
        aria-pressed={isListening}
        aria-describedby="voice-status-msg"
        className={`w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors ${
          isListening
            ? 'bg-brand-error text-white animate-pulse'
            : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
        }`}
      >
        <span aria-hidden="true" className="text-xl">
          {isListening ? '⏹️' : '🎙️'}
        </span>
        <span>
          {isListening
            ? getTranslation(locale, 'voice_btn_stop')
            : getTranslation(locale, 'voice_btn_idle')}
        </span>
      </button>

      <div
        id="voice-status-msg"
        aria-live="polite"
        className="text-sm font-medium text-brand-secondary text-center min-h-[24px]"
      >
        {isListening ? (
          <span className="text-brand-error font-semibold flex items-center gap-1 justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-error animate-ping" />
            {getTranslation(locale, 'voice_btn_listening')}
          </span>
        ) : !isSupported ? (
          <span>{getTranslation(locale, 'voice_not_supported')}</span>
        ) : (
          <span>{speechStatus || getTranslation(locale, 'voice_fallback_notice')}</span>
        )}
      </div>
    </div>
  );
};
