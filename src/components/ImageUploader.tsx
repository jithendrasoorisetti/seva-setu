'use client';

import React, { useState, useRef } from 'react';
import { SupportedLocale, getTranslation } from '@/i18n';

interface ImageUploaderProps {
  locale: SupportedLocale;
  onImageSelected: (base64: string, mime: 'image/jpeg' | 'image/png' | 'image/webp') => void;
  onImageRemoved: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  locale,
  onImageSelected,
  onImageRemoved,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const acceptedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedMimes.includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or WebP image.');
      return;
    }

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelected(result, file.type as 'image/jpeg' | 'image/png' | 'image/webp');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemoved();
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 my-2 text-left">
      <label
        htmlFor="doc-photo-upload"
        className="w-full text-sm sm:text-base font-semibold text-brand-text flex items-center gap-2 cursor-pointer"
      >
        <span>📷</span>
        <span>{getTranslation(locale, 'photo_upload_label')}</span>
      </label>

      <input
        ref={fileInputRef}
        id="doc-photo-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="w-full text-sm text-brand-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border file:border-brand-border file:text-sm file:font-semibold file:bg-brand-elevated file:text-brand-text hover:file:bg-brand-surface cursor-pointer focus:outline-none"
      />

      {error && (
        <p role="alert" className="text-sm font-semibold text-brand-error">
          ⚠️ {error}
        </p>
      )}

      {preview && (
        <div className="w-full bg-brand-elevated p-3 rounded-xl border border-brand-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 truncate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Uploaded document thumbnail preview"
              className="w-12 h-12 rounded object-cover border border-brand-border"
            />
            <span className="text-sm font-medium text-brand-text truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove uploaded image"
            className="min-h-[44px] px-3 py-1.5 text-sm font-semibold text-brand-error hover:bg-brand-error/10 rounded-lg"
          >
            ✕ Remove
          </button>
        </div>
      )}
    </div>
  );
};
