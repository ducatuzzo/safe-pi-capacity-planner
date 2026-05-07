// Feature 29: Zeremonien-Editor pro PI – CRUD + Modal
// .ics-Export wird in Schritt 5 hinzugefügt (Button-Platzhalter ist disabled)

import { useState } from 'react';
import { Pencil, Trash2, Plus, Download } from 'lucide-react';
import type { PIPlanning, PIZeremonie, ZeremonieType } from '../../types';
import {
  ZEREMONIE_LABELS,
  ZEREMONIE_DEFAULT_DURATION,
  ZEREMONIE_DEFAULT_START_TIME,
} from '../../utils/pi-calculator';
import { downloadIcs } from '../../utils/ics-export';

interface Props {
  pi: PIPlanning;
  onPiChange: (updatedPi: PIPlanning) => void;
}

interface ZeremonieFormState {
  type: ZeremonieType;
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  location: string;
  description: string;
  iterationId: string; // '' = keine Zuordnung
}

const ZEREMONIE_TYPES: ZeremonieType[] = [
  'PI_PLANNING',
  'DRAFT_PLAN_REVIEW',
  'FINAL_PLAN_REVIEW',
  'PRIO_MEETING',
  'SYSTEM_DEMO',
  'FINAL_SYSTEM_DEMO',
  'INSPECT_ADAPT',
];

function leeresFormular(pi: PIPlanning): ZeremonieFormState {
  const initialType: ZeremonieType = 'SYSTEM_DEMO';
  return {
    type: initialType,
    title: ZEREMONIE_LABELS[initialType],
    date: pi.startStr,
    startTime: ZEREMONIE_DEFAULT_START_TIME[initialType],
    durationMinutes: ZEREMONIE_DEFAULT_DURATION[initialType],
    location: '',
    description: '',
    iterationId: '',
  };
}

function validiereZeremonie(f: ZeremonieFormState, pi: PIPlanning): string | null {
  if (!f.type) return 'Typ ist erforderlich.';
  if (!f.title.trim()) return 'Titel ist erforderlich.';
  if (!f.date) return 'Datum ist erforderlich.';
  if (f.date < pi.startStr || f.date > pi.endStr) {
    return `Datum muss innerhalb des PI-Zeitraums liegen (${pi.startStr} – ${pi.endStr}).`;
  }
  if (!f.startTime || !/^\d{2}:\d{2}$/.test(f.startTime)) return 'Startzeit muss im Format HH:MM angegeben werden.';
  if (f.durationMinutes < 1 || f.durationMinutes > 60 * 48) {
    return 'Dauer muss zwischen 1 Minute und 48 Stunden liegen.';
  }
  return null;
}

/** Zeigt Minuten als "X Min" / "Xh" / "X.XT" (T = Tag à 8h) */
function formatDauer(min: number): string {
  if (min < 60) return `${min} Min`;
  if (min < 8 * 60) return `${(min / 60).toFixed(min % 60 === 0 ? 0 : 1)}h`;
  const tage = min / (8 * 60);
  return `${tage.toFixed(tage % 1 === 0 ? 0 : 1)}T`;
}

export default function ZeremonienEditor({ pi, onPiChange }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<ZeremonieFormState>(leeresFormular(pi));
  const [fehler, setFehler] = useState<string | null>(null);
  const [loescheId, setLoescheId] = useState<string | null>(null);

  const zeremonien = pi.zeremonien ?? [];

  function oeffneNeu() {
    setForm(leeresFormular(pi));
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }

  function oeffneBearbeiten(z: PIZeremonie) {
    setForm({
      type: z.type,
      title: z.title,
      date: z.date,
      startTime: z.startTime,
      durationMinutes: z.durationMinutes,
      location: z.location,
      description: z.description,
      iterationId: z.iterationId ?? '',
    });
    setBearbeiteteId(z.id);
    setFehler(null);
    setModalOffen(true);
  }

  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }

  /** Bei Typ-Wechsel: Default-Dauer/Zeit übernehmen (sofern Titel noch dem alten Default entspricht) */
  function aendereTyp(neuerTyp: ZeremonieType) {
    setForm(f => {
      const titelWarDefault = f.title === ZEREMONIE_LABELS[f.type];
      return {
        ...f,
        type: neuerTyp,
        title: titelWarDefault ? ZEREMONIE_LABELS[neuerTyp] : f.title,
        startTime: ZEREMONIE_DEFAULT_START_TIME[neuerTyp],
        durationMinutes: ZEREMONIE_DEFAULT_DURATION[neuerTyp],
      };
    });
  }

  function speichern() {
    const err = validiereZeremonie(form, pi);
    if (err) { setFehler(err); return; }

    const neue: PIZeremonie = {
      id: bearbeiteteId ?? crypto.randomUUID(),
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      durationMinutes: form.durationMinutes,
      location: form.location.trim(),
      description: form.description.trim(),
      iterationId: form.iterationId || undefined,
    };

    const neueListe = bearbeiteteId
      ? zeremonien.map(z => (z.id === bearbeiteteId ? neue : z))
      : [...zeremonien, neue];

    onPiChange({ ...pi, zeremonien: neueListe });
    schliesseModal();
  }

  function loeschen(id: string) {
    onPiChange({ ...pi, zeremonien: zeremonien.filter(z => z.id !== id) });
    setLoescheId(null);
  }

  /** Sortierung: nach Datum + Startzeit aufsteigend */
  const sortiert = [...zeremonien].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.startTime < b.startTime ? -1 : 1;
  });

  function iterationName(id?: string): string {
    if (!id) return '–';
    return pi.iterationen.find(it => it.id === id)?.name ?? '–';
  }

  return (
    <div className="mt-4 pt-3 border-t border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-bund-blau uppercase tracking-wide">
          Zeremonien – {pi.name}
        </span>
        <button
          onClick={oeffneNeu}
          className="flex items-center gap-1 px-2 py-1 bg-bund-blau text-white text-xs rounded hover:bg-blue-900 transition-colors"
        >
          <Plus size={13} />
          Zeremonie
        </button>
      </div>

      {sortiert.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">Keine Zeremonien erfasst.</p>
      ) : (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-blue-200 text-gray-600">
              <th className="py-1 px-2 text-left font-medium">Typ</th>
              <th className="py-1 px-2 text-left font-medium">Titel</th>
              <th className="py-1 px-2 text-left font-medium">Datum</th>
              <th className="py-1 px-2 text-left font-medium">Zeit</th>
              <th className="py-1 px-2 text-left font-medium">Dauer</th>
              <th className="py-1 px-2 text-left font-medium">Iter.</th>
              <th className="py-1 px-2 text-center font-medium">.ics</th>
              <th className="py-1 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortiert.map(z => (
              <tr key={z.id} className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
                <td className="py-1 px-2">{ZEREMONIE_LABELS[z.type]}</td>
                <td className="py-1 px-2">{z.title}</td>
                <td className="py-1 px-2">{z.date}</td>
                <td className="py-1 px-2">{z.startTime}</td>
                <td className="py-1 px-2">{formatDauer(z.durationMinutes)}</td>
                <td className="py-1 px-2">{iterationName(z.iterationId)}</td>
                <td className="py-1 px-2 text-center">
                  <button
                    onClick={() => downloadIcs(pi, z)}
                    title=".ics-Datei herunterladen"
                    className="p-0.5 text-gray-500 hover:text-bund-blau transition-colors"
                  >
                    <Download size={13} />
                  </button>
                </td>
                <td className="py-1 px-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => oeffneBearbeiten(z)}
                      className="p-0.5 text-gray-400 hover:text-bund-blau transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setLoescheId(z.id)}
                      className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal: Zeremonie Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">
                {bearbeiteteId ? 'Zeremonie bearbeiten' : 'Zeremonie hinzufügen'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                PI: {pi.name} ({pi.startStr} – {pi.endStr})
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Typ *</label>
                <select
                  value={form.type}
                  onChange={e => aendereTyp(e.target.value as ZeremonieType)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  {ZEREMONIE_TYPES.map(t => (
                    <option key={t} value={t}>{ZEREMONIE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <FormFeld
                label="Titel *"
                value={form.title}
                onChange={v => setForm(f => ({ ...f, title: v }))}
              />
              <div className="grid grid-cols-3 gap-3">
                <FormFeld
                  label="Datum *"
                  value={form.date}
                  onChange={v => setForm(f => ({ ...f, date: v }))}
                  type="date"
                />
                <FormFeld
                  label="Startzeit *"
                  value={form.startTime}
                  onChange={v => setForm(f => ({ ...f, startTime: v }))}
                  type="time"
                />
                <FormFeldZahl
                  label="Dauer (Min) *"
                  value={form.durationMinutes}
                  onChange={v => setForm(f => ({ ...f, durationMinutes: v }))}
                  min={1}
                  max={60 * 48}
                />
              </div>
              <FormFeld
                label="Ort / Link"
                value={form.location}
                onChange={v => setForm(f => ({ ...f, location: v }))}
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Iteration (optional)</label>
                <select
                  value={form.iterationId}
                  onChange={e => setForm(f => ({ ...f, iterationId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  <option value="">— keine Zuordnung —</option>
                  {pi.iterationen.map(it => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {fehler && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
                {fehler}
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={schliesseModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={speichern}
                className="px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigung: Zeremonie löschen */}
      {loescheId && (() => {
        const z = zeremonien.find(z => z.id === loescheId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
              <p className="text-sm text-gray-700 mb-6">
                Zeremonie «{z?.title}» wirklich löschen?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setLoescheId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => loeschen(loescheId)}
                  className="px-4 py-2 text-sm bg-bund-blau text-white rounded hover:bg-blue-900 transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface FormFeldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

function FormFeld({ label, value, onChange, type = 'text' }: FormFeldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
      />
    </div>
  );
}

interface FormFeldZahlProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

function FormFeldZahl({ label, value, onChange, min, max }: FormFeldZahlProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
      />
    </div>
  );
}
