// Feature 17: Globale Kapazitätsparameter – SP/Tag und Stunden/Jahr

import { useState } from 'react';
import type { GlobalCapacityConfig } from '../../types';

interface Props {
  config: GlobalCapacityConfig;
  onChange: (config: GlobalCapacityConfig) => void;
}

export default function GlobalConfigSettings({ config, onChange }: Props) {
  const [draft, setDraft] = useState<GlobalCapacityConfig>(config);
  const [gespeichert, setGespeichert] = useState(false);

  const isDirty =
    draft.spPerDay !== config.spPerDay || draft.hoursPerYear !== config.hoursPerYear;

  function handleSave() {
    onChange(draft);
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
  }

  function handleReset() {
    setDraft(config);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Globale Parameter</h2>
      <p className="text-sm text-gray-500 mb-6">
        Globale Standardwerte für SP-Berechnungen. Diese Parameter gelten als Referenz für alle Teams.
      </p>

      <div className="max-w-md space-y-5">
        {/* SP pro Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SP pro Tag
          </label>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={draft.spPerDay}
            onChange={e => setDraft(prev => ({ ...prev, spPerDay: parseFloat(e.target.value) || 0.5 }))}
            className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
          />
          <p className="mt-1 text-xs text-gray-400">Standard: 1.0 – Anzahl Story Points die ein Vollzeit-Mitarbeiter pro Tag leisten kann.</p>
        </div>

        {/* Arbeitsstunden pro Jahr */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arbeitsstunden pro Jahr
          </label>
          <input
            type="number"
            min={800}
            max={2200}
            step={100}
            value={draft.hoursPerYear}
            onChange={e => setDraft(prev => ({ ...prev, hoursPerYear: parseInt(e.target.value, 10) || 1600 }))}
            className="w-32 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
          />
          <p className="mt-1 text-xs text-gray-400">Standard: 1600 – Referenzwert für FTE-Umrechnung.</p>
        </div>

        {/* Warnung */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          ⚠️ Änderungen wirken sofort auf alle SP-Berechnungen der gesamten App.
        </div>

        {/* Aktionen */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={[
              'px-4 py-2 text-sm rounded transition-colors',
              isDirty
                ? 'bg-bund-blau text-white hover:bg-blue-900'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ].join(' ')}
          >
            Speichern
          </button>
          {isDirty && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Zurücksetzen
            </button>
          )}
        </div>

        {gespeichert && (
          <p className="text-sm text-green-600">Gespeichert.</p>
        )}
      </div>
    </div>
  );
}
