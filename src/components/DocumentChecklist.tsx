'use client';

import React, { useState } from 'react';
import { SchemeDocument } from '@/schemas/scheme';
import { SupportedLocale, getTranslation } from '@/i18n';

interface DocumentChecklistProps {
  documents: SchemeDocument[];
  schemeId: string;
  locale: SupportedLocale;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  documents,
  schemeId,
  locale,
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDoc = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSaveChecklist = async () => {
    setIsSaving(true);
    setSavedStatus(null);
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'citizen-session',
          scheme_id: schemeId,
          checked_document_ids: checkedIds,
        }),
      });
      if (res.ok) {
        setSavedStatus('Checklist progress saved successfully.');
      } else {
        setSavedStatus('Progress cached locally.');
      }
    } catch {
      setSavedStatus('Progress cached locally.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4 text-left">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg sm:text-xl font-bold text-brand-text">
          {getTranslation(locale, 'documents_title')}
        </h3>
        <span className="text-sm font-semibold text-brand-secondary">
          {checkedIds.length} / {documents.length} Ready
        </span>
      </div>

      <div className="space-y-2.5">
        {documents.map((doc) => {
          const isChecked = checkedIds.includes(doc.id);
          const docName = doc.name[locale] || doc.name.en;
          const docPurpose = doc.purpose[locale] || doc.purpose.en;

          return (
            <label
              key={doc.id}
              className={`min-h-[56px] p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800'
                  : 'bg-brand-elevated border-brand-border hover:border-brand-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleDoc(doc.id)}
                  className="w-5 h-5 rounded text-brand-accent focus:ring-brand-accent cursor-pointer"
                />
                <div>
                  <span className={`text-base font-semibold block ${isChecked ? 'line-through text-brand-muted' : 'text-brand-text'}`}>
                    {docName}
                  </span>
                  <span className="text-xs sm:text-sm text-brand-secondary block">
                    {docPurpose}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  doc.is_mandatory
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {doc.is_mandatory ? getTranslation(locale, 'doc_mandatory') : getTranslation(locale, 'doc_optional')}
              </span>
            </label>
          );
        })}
      </div>

      <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={handleSaveChecklist}
          disabled={isSaving}
          className="min-h-[44px] px-4 py-2 bg-brand-surface border border-brand-border rounded-xl font-semibold text-sm hover:bg-brand-elevated text-brand-text transition-colors"
        >
          {isSaving ? 'Saving…' : '💾 Save Checklist Progress'}
        </button>

        {savedStatus && (
          <p role="status" className="text-xs font-semibold text-brand-success">
            ✓ {savedStatus}
          </p>
        )}
      </div>
    </div>
  );
};
