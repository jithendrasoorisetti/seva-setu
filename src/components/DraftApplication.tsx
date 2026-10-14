'use client';

import React, { useState } from 'react';
import { CitizenProfile } from '@/schemas/citizen';
import { Scheme } from '@/schemas/scheme';
import { SupportedLocale, getTranslation } from '@/i18n';

interface DraftApplicationProps {
  scheme: Scheme;
  profile: CitizenProfile;
  locale: SupportedLocale;
}

export const DraftApplication: React.FC<DraftApplicationProps> = ({
  scheme,
  profile,
  locale,
}) => {
  const [applicantName, setApplicantName] = useState('');
  const [district, setDistrict] = useState('Guntur');
  const [mandal, setMandal] = useState('');
  const [villageWard, setVillageWard] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_id: scheme.id,
          language: locale,
          profile,
          applicant_name: applicantName || 'Citizen Applicant',
          district: district || 'Andhra Pradesh',
          mandal: mandal || 'Local Mandal',
          village_ward: villageWard || 'Local Grama Sachivalayam',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate draft');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sevasetu-draft-${scheme.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Could not download draft. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-left">
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-brand-text flex items-center gap-2">
          <span>📄</span>
          <span>Download Pre-filled Draft Application</span>
        </h3>
        <p className="text-sm text-brand-secondary">
          Take this pre-filled paper draft directly to your Grama/Ward Sachivalayam.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="applicant-name" className="block text-sm font-semibold text-brand-text mb-1">
            Applicant Full Name (దరఖాస్తుదారు పేరు)
          </label>
          <input
            id="applicant-name"
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="e.g. Venkata Lakshmi"
            className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="district-select" className="block text-sm font-semibold text-brand-text mb-1">
            District (జిల్లా)
          </label>
          <select
            id="district-select"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
          >
            <option value="Guntur">Guntur (గుంటూరు)</option>
            <option value="Krishna">Krishna (కృష్ణా)</option>
            <option value="Visakhapatnam">Visakhapatnam (విశాఖపట్నం)</option>
            <option value="Tirupati">Tirupati (తిరుపతి)</option>
            <option value="Kurnool">Kurnool (కర్నూలు)</option>
            <option value="East Godavari">East Godavari (తూర్పు గోదావరి)</option>
            <option value="West Godavari">West Godavari (పశ్చిమ గోదావరి)</option>
            <option value="Ananthapuramu">Ananthapuramu (అనంతపురం)</option>
            <option value="Prakasam">Prakasam (ప్రకాశం)</option>
            <option value="Srikakulam">Srikakulam (శ్రీకాకుళం)</option>
          </select>
        </div>

        <div>
          <label htmlFor="mandal-name" className="block text-sm font-semibold text-brand-text mb-1">
            Mandal (మండలం)
          </label>
          <input
            id="mandal-name"
            type="text"
            value={mandal}
            onChange={(e) => setMandal(e.target.value)}
            placeholder="e.g. Tenali"
            className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="village-name" className="block text-sm font-semibold text-brand-text mb-1">
            Village / Ward (గ్రామం / వార్డు)
          </label>
          <input
            id="village-name"
            type="text"
            value={villageWard}
            onChange={(e) => setVillageWard(e.target.value)}
            placeholder="e.g. Ward 4 / Kothapet"
            className="w-full min-h-[48px] px-3.5 py-2 rounded-xl border border-brand-border bg-brand-elevated text-brand-text text-base focus:border-brand-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-brand-elevated border border-brand-border rounded-xl p-3.5 text-xs sm:text-sm text-brand-muted space-y-1">
        <p className="font-semibold text-brand-text">🔒 Privacy Assurance:</p>
        <p>{getTranslation(locale, 'privacy_note')}</p>
      </div>

      <button
        type="button"
        id="download-draft-btn"
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full min-h-[48px] bg-brand-accent text-white hover:bg-brand-accent-hover font-semibold rounded-xl px-6 py-3 transition-colors flex items-center justify-center gap-2"
      >
        <span aria-hidden="true">📥</span>
        <span>
          {isDownloading
            ? getTranslation(locale, 'downloading_label')
            : getTranslation(locale, 'draft_download_button')}
        </span>
      </button>
    </div>
  );
};
