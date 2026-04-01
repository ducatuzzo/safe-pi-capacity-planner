// Einstellungen: Farbkonfiguration für Buchungstypen und Kalender

import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import type { AllocationType, FarbConfig } from '../../types';
import { DEFAULT_FARB_CONFIG, BUCHUNGSTYP_LABEL } from '../../constants';

interface Props {
  farbConfig: FarbConfig;
  onChange: (config: FarbConfig) => void;
}

// Buchungstypen ohne NONE (nicht buchbar, keine Farbe konfigurierbar)
const BUCHUNGSTYPEN: AllocationType[] = [
  'FERIEN', 'ABWESEND', 'TEILZEIT', 'MILITAER', 'IPA', 'BETRIEB', 'BETRIEB_PIKETT', 'PIKETT',
];

// Buchstaben für Vorschau-Zelle
const BUCHUNGSTYP_LETTER: Record<AllocationType, string> = {
  NONE: '', FERIEN: 'F', ABWESEND: 'A', TEILZEIT: 'T',
  MILITAER: 'M', IPA: 'I', BETRIEB: 'B', BETRIEB_PIKETT: 'BP', PIKETT: 'P',
};

type KalenderKey = 'feiertag' | 'schulferien' | 'blocker' | 'wochenende';

const KALENDER_LABEL: Record<KalenderKey, string> = {
  feiertag:   'Feiertag',
  schulferien: 'Schulferien',
  blocker:    'Blocker / Change Freeze',
  wochenende: 'Wochenende',
};

const KALENDER_KEYS: KalenderKey[] = ['feiertag', 'schulferien', 'blocker', 'wochenende'];

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function setBuchungstyp(
  config: FarbConfig,
  type: AllocationType,
  field: 'bg' | 'text',
  value: string,
): FarbConfig {
  return {
    ...config,
    buchungstypen: {
      ...config.buchungstypen,
      [type]: { ...config.buchungstypen[type], [field]: value },
    },
  };
}

function setKalender(
  config: FarbConfig,
  key: KalenderKey,
  field: 'bg' | 'text',
  value: string,
): FarbConfig {
  return {
    ...config,
    kalender: {
      ...config.kalender,
      [key]: { ...config.kalender[key], [field]: value },
    },
  };
}

function setHeuteField(
  config: FarbConfig,
  field: 'text' | 'bold',
  value: string | boolean,
): FarbConfig {
  return {
    ...config,
    kalender: {
      ...config.kalender,
      heute: { ...config.kalender.heute, [field]: value },
    },
  };
}

// CSV Export/Import ──────────────────────────────────────────────────────────

function configToCsv(config: FarbConfig): string {
  const bom = '\uFEFF';
  const header = 'Kategorie;Typ;Hintergrundfarbe;Schriftfarbe;Fett';
  const rows: string[] = [bom + header];
  for (const type of BUCHUNGSTYPEN) {
    const f = config.buchungstypen[type];
    rows.push(`buchung;${type};${f.bg};${f.text};`);
  }
  for (const key of KALENDER_KEYS) {
    const f = config.kalender[key];
    rows.push(`kalender;${key};${f.bg};${f.text};`);
  }
  rows.push(`kalender;heute;;${config.kalender.heute.text};${config.kalender.heute.bold}`);
  return rows.join('\r\n');
}

function parseCsv(raw: string): FarbConfig | string {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('Kategorie'));

  const config: FarbConfig = JSON.parse(JSON.stringify(DEFAULT_FARB_CONFIG));

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length < 4) continue;
    const [kat, typ, bg, text, fett] = parts;

    if (kat === 'buchung') {
      if (!BUCHUNGSTYPEN.includes(typ as AllocationType)) continue;
      const t = typ as AllocationType;
      if (bg) config.buchungstypen[t].bg = bg;
      if (text) config.buchungstypen[t].text = text;
    } else if (kat === 'kalender') {
      if (typ === 'heute') {
        if (text) config.kalender.heute.text = text;
        if (fett !== undefined && fett !== '') config.kalender.heute.bold = fett === 'true';
      } else if (KALENDER_KEYS.includes(typ as KalenderKey)) {
        const k = typ as KalenderKey;
        if (bg) config.kalender[k].bg = bg;
        if (text) config.kalender[k].text = text;
      }
    }
  }
  return config;
}

// ── Komponente ────────────────────────────────────────────────────────────────

export default function FarbeinstellungenSettings({ farbConfig, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetAll = () => {
    if (window.confirm('Alle Farben auf Standardwerte zurücksetzen?')) {
      onChange(JSON.parse(JSON.stringify(DEFAULT_FARB_CONFIG)));
    }
  };

  const handleExportCsv = () => {
    const csv = configToCsv(farbConfig);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'farbkonfiguration.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result;
      if (typeof raw !== 'string') return;
      const result = parseCsv(raw);
      if (typeof result === 'string') {
        alert(`Importfehler: ${result}`);
      } else {
        onChange(result);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-800">Farbeinstellungen</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-600"
          >
            CSV exportieren
          </button>
          <button
            onClick={handleImportCsv}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-600"
          >
            CSV importieren
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            <RotateCcw size={12} />
            Alle zurücksetzen
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Farben für Buchungstypen und Kalenderzustände anpassen. Änderungen sind sofort im Kalender sichtbar.
      </p>

      {/* ── Buchungstypen ── */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Buchungstypen</h3>
        <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-3 py-2 font-medium">Kürzel</th>
              <th className="text-left px-3 py-2 font-medium">Bezeichnung</th>
              <th className="text-center px-3 py-2 font-medium">Hintergrund</th>
              <th className="text-center px-3 py-2 font-medium">Schriftfarbe</th>
              <th className="text-center px-3 py-2 font-medium">Vorschau</th>
              <th className="text-center px-3 py-2 font-medium">Reset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {BUCHUNGSTYPEN.map(type => {
              const farbe = farbConfig.buchungstypen[type];
              const def = DEFAULT_FARB_CONFIG.buchungstypen[type];
              const istGeaendert = farbe.bg !== def.bg || farbe.text !== def.text;
              return (
                <tr key={type} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono font-semibold text-gray-700">
                    {BUCHUNGSTYP_LETTER[type]}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{BUCHUNGSTYP_LABEL[type]}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={farbe.bg}
                        onChange={e => onChange(setBuchungstyp(farbConfig, type, 'bg', e.target.value))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        title="Hintergrundfarbe wählen"
                      />
                      <span className="text-xs text-gray-400 font-mono">{farbe.bg}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={farbe.text}
                        onChange={e => onChange(setBuchungstyp(farbConfig, type, 'text', e.target.value))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        title="Schriftfarbe wählen"
                      />
                      <span className="text-xs text-gray-400 font-mono">{farbe.text}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className="inline-flex items-center justify-center w-8 h-7 rounded text-[11px] font-semibold"
                      style={{ backgroundColor: farbe.bg, color: farbe.text }}
                    >
                      {BUCHUNGSTYP_LETTER[type]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onChange(setBuchungstyp(
                        setBuchungstyp(farbConfig, type, 'bg', def.bg),
                        type, 'text', def.text,
                      ))}
                      disabled={!istGeaendert}
                      title="Auf Standardfarbe zurücksetzen"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-default transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ── Kalenderfarben ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Kalenderfarben</h3>
        <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="text-left px-3 py-2 font-medium">Bereich</th>
              <th className="text-center px-3 py-2 font-medium">Hintergrund</th>
              <th className="text-center px-3 py-2 font-medium">Schriftfarbe</th>
              <th className="text-center px-3 py-2 font-medium">Vorschau</th>
              <th className="text-center px-3 py-2 font-medium">Reset</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {KALENDER_KEYS.map(key => {
              const farbe = farbConfig.kalender[key];
              const def = DEFAULT_FARB_CONFIG.kalender[key];
              const istGeaendert = farbe.bg !== def.bg || farbe.text !== def.text;
              return (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600">{KALENDER_LABEL[key]}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={farbe.bg}
                        onChange={e => onChange(setKalender(farbConfig, key, 'bg', e.target.value))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        title="Hintergrundfarbe wählen"
                      />
                      <span className="text-xs text-gray-400 font-mono">{farbe.bg}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="color"
                        value={farbe.text}
                        onChange={e => onChange(setKalender(farbConfig, key, 'text', e.target.value))}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        title="Schriftfarbe wählen"
                      />
                      <span className="text-xs text-gray-400 font-mono">{farbe.text}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className="inline-flex items-center justify-center w-8 h-7 rounded text-[11px]"
                      style={{ backgroundColor: farbe.bg, color: farbe.text }}
                    >
                      {key === 'blocker' ? '❄️' : 'Aa'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onChange(setKalender(
                        setKalender(farbConfig, key, 'bg', def.bg),
                        key, 'text', def.text,
                      ))}
                      disabled={!istGeaendert}
                      title="Auf Standardfarbe zurücksetzen"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-default transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Sonderzeile: Heute (kein Hintergrund, nur Schriftfarbe + Fett) */}
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-600">Heute (Datum-Hervorhebung)</td>
              <td className="px-3 py-2 text-center">
                <span className="text-xs text-gray-400">—</span>
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="color"
                    value={farbConfig.kalender.heute.text}
                    onChange={e => onChange(setHeuteField(farbConfig, 'text', e.target.value))}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    title="Schriftfarbe wählen"
                  />
                  <span className="text-xs text-gray-400 font-mono">{farbConfig.kalender.heute.text}</span>
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={farbConfig.kalender.heute.bold}
                      onChange={e => onChange(setHeuteField(farbConfig, 'bold', e.target.checked))}
                      className="rounded"
                    />
                    Fett
                  </label>
                </div>
              </td>
              <td className="px-3 py-2 text-center">
                <span
                  className="inline-flex items-center justify-center w-8 h-7 rounded text-[11px] bg-red-50"
                  style={{
                    color: farbConfig.kalender.heute.text,
                    fontWeight: farbConfig.kalender.heute.bold ? 'bold' : 'normal',
                  }}
                >
                  28
                </span>
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onChange(setHeuteField(
                    setHeuteField(farbConfig, 'text', DEFAULT_FARB_CONFIG.kalender.heute.text),
                    'bold', DEFAULT_FARB_CONFIG.kalender.heute.bold,
                  ))}
                  disabled={
                    farbConfig.kalender.heute.text === DEFAULT_FARB_CONFIG.kalender.heute.text &&
                    farbConfig.kalender.heute.bold === DEFAULT_FARB_CONFIG.kalender.heute.bold
                  }
                  title="Auf Standardfarbe zurücksetzen"
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
