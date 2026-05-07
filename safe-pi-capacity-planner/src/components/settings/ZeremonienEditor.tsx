// Feature 29 v2 (Schema 1.6): Zeremonien-Editor mit Start/Ende-Datum + Serie
// CRUD + Modal + .ics-Export pro Zeremonie

import { useState } from 'react';
import { Pencil, Trash2, Plus, Download, Repeat } from 'lucide-react';
import type { PIPlanning, PIZeremonie, ZeremonieType } from '../../types';
import {
  ZEREMONIE_LABELS,
  ZEREMONIE_DEFAULT_DURATION,
  ZEREMONIE_DEFAULT_START_TIME,
  addMinutes,
} from '../../utils/pi-calculator';
import { downloadIcs } from '../../utils/ics-export';

interface Props {
  pi: PIPlanning;
  onPiChange: (updatedPi: PIPlanning) => void;
}

type RecurrenceMode = 'count' | 'until';

interface ZeremonieFormState {
  type: ZeremonieType;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  iterationId: string;
  // Serie:
  hasRecurrence: boolean;
  recurrenceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval: number;
  recurrenceMode: RecurrenceMode;
  recurrenceCount: number;
  recurrenceUntil: string;
}

const ZEREMONIE_TYPES: ZeremonieType[] = [
  'PI_PLANNING', 'DRAFT_PLAN_REVIEW', 'FINAL_PLAN_REVIEW', 'PRIO_MEETING',
  'SYSTEM_DEMO', 'FINAL_SYSTEM_DEMO', 'INSPECT_ADAPT',
];

const FREQUENCY_LABEL: Record<'DAILY' | 'WEEKLY' | 'MONTHLY', string> = {
  DAILY: 'Täglich',
  WEEKLY: 'Wöchentlich',
  MONTHLY: 'Monatlich',
};

// ─── Defaults ──────────────────────────────────────────────────────────────────

function leeresFormular(pi: PIPlanning): ZeremonieFormState {
  const initialType: ZeremonieType = 'SYSTEM_DEMO';
  const startDate = pi.startStr;
  const startTime = ZEREMONIE_DEFAULT_START_TIME[initialType];
  const dur = ZEREMONIE_DEFAULT_DURATION[initialType];
  const computed = addMinutes(startDate, startTime, dur);
  return {
    type: initialType,
    title: ZEREMONIE_LABELS[initialType],
    startDate,
    startTime,
    endDate: computed.date,
    endTime: computed.time,
    location: '',
    description: '',
    iterationId: '',
    hasRecurrence: false,
    recurrenceFrequency: 'WEEKLY',
    recurrenceInterval: 1,
    recurrenceMode: 'count',
    recurrenceCount: 5,
    recurrenceUntil: pi.endStr,
  };
}

// ─── Validierung ───────────────────────────────────────────────────────────────

function validiereZeremonie(f: ZeremonieFormState, pi: PIPlanning): string | null {
  if (!f.type) return 'Typ ist erforderlich.';
  if (!f.title.trim()) return 'Titel ist erforderlich.';
  if (!f.startDate) return 'Start-Datum ist erforderlich.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.startDate)) return 'Start-Datum muss im Format YYYY-MM-DD sein.';
  if (f.startDate < pi.startStr || f.startDate > pi.endStr) {
    return `Start-Datum muss innerhalb des PI-Zeitraums liegen (${pi.startStr} – ${pi.endStr}).`;
  }
  if (!f.startTime || !/^\d{2}:\d{2}$/.test(f.startTime)) return 'Start-Zeit muss im Format HH:MM sein.';
  if (!f.endDate) return 'Ende-Datum ist erforderlich.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.endDate)) return 'Ende-Datum muss im Format YYYY-MM-DD sein.';
  if (!f.endTime || !/^\d{2}:\d{2}$/.test(f.endTime)) return 'Ende-Zeit muss im Format HH:MM sein.';
  if (f.endDate < f.startDate) return 'Ende-Datum muss am Start-Datum oder später liegen.';
  if (f.endDate === f.startDate && f.endTime <= f.startTime) {
    return 'Wenn Start- und Ende-Datum gleich sind, muss die Ende-Zeit nach der Start-Zeit liegen.';
  }
  if (f.hasRecurrence) {
    if (f.recurrenceInterval < 1 || f.recurrenceInterval > 99) {
      return 'Serien-Intervall muss zwischen 1 und 99 liegen.';
    }
    if (f.recurrenceMode === 'count') {
      if (f.recurrenceCount < 1 || f.recurrenceCount > 999) {
        return 'Anzahl Wiederholungen muss zwischen 1 und 999 liegen.';
      }
    } else {
      if (!f.recurrenceUntil || !/^\d{4}-\d{2}-\d{2}$/.test(f.recurrenceUntil)) {
        return 'Serien-Enddatum ist erforderlich (YYYY-MM-DD).';
      }
      if (f.recurrenceUntil < f.startDate) {
        return 'Serien-Enddatum muss am Start-Datum oder später liegen.';
      }
    }
  }
  return null;
}

// ─── Display-Helpers ──────────────────────────────────────────────────────────

function formatRecurrence(z: PIZeremonie): string {
  if (!z.recurrence) return '—';
  const freq = FREQUENCY_LABEL[z.recurrence.frequency];
  const interval = z.recurrence.interval > 1 ? ` (alle ${z.recurrence.interval})` : '';
  if (z.recurrence.count !== undefined) {
    return `${freq}${interval} × ${z.recurrence.count}`;
  }
  if (z.recurrence.until) {
    return `${freq}${interval} bis ${z.recurrence.until}`;
  }
  return freq + interval;
}

function formatDateTimeShort(date: string, time: string): string {
  if (!date || !time) return '—';
  return `${date} ${time}`;
}

// ─── Komponente ────────────────────────────────────────────────────────────────

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
    // Schema-1.6-Felder bevorzugen, Fallback auf 1.5
    const startDate = z.startDate ?? z.date;
    const computed = addMinutes(startDate, z.startTime, z.durationMinutes);
    const endDate = z.endDate ?? computed.date;
    const endTime = z.endTime ?? computed.time;

    setForm({
      type: z.type,
      title: z.title,
      startDate,
      startTime: z.startTime,
      endDate,
      endTime,
      location: z.location,
      description: z.description,
      iterationId: z.iterationId ?? '',
      hasRecurrence: !!z.recurrence,
      recurrenceFrequency: z.recurrence?.frequency ?? 'WEEKLY',
      recurrenceInterval: z.recurrence?.interval ?? 1,
      recurrenceMode: z.recurrence?.until ? 'until' : 'count',
      recurrenceCount: z.recurrence?.count ?? 5,
      recurrenceUntil: z.recurrence?.until ?? pi.endStr,
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

  /** Bei Typ-Wechsel: Default-Zeit + Default-Ende übernehmen (sofern Titel = Default) */
  function aendereTyp(neuerTyp: ZeremonieType) {
    setForm(f => {
      const titelWarDefault = f.title === ZEREMONIE_LABELS[f.type];
      const newStartTime = ZEREMONIE_DEFAULT_START_TIME[neuerTyp];
      const newDur = ZEREMONIE_DEFAULT_DURATION[neuerTyp];
      const computed = addMinutes(f.startDate, newStartTime, newDur);
      return {
        ...f,
        type: neuerTyp,
        title: titelWarDefault ? ZEREMONIE_LABELS[neuerTyp] : f.title,
        startTime: newStartTime,
        endDate: computed.date,
        endTime: computed.time,
      };
    });
  }

  function speichern() {
    const err = validiereZeremonie(form, pi);
    if (err) { setFehler(err); return; }

    // Schema 1.5 (legacy): durationMinutes berechnen
    const startMs = Date.UTC(
      Number(form.startDate.slice(0, 4)),
      Number(form.startDate.slice(5, 7)) - 1,
      Number(form.startDate.slice(8, 10)),
      Number(form.startTime.slice(0, 2)),
      Number(form.startTime.slice(3, 5)),
    );
    const endMs = Date.UTC(
      Number(form.endDate.slice(0, 4)),
      Number(form.endDate.slice(5, 7)) - 1,
      Number(form.endDate.slice(8, 10)),
      Number(form.endTime.slice(0, 2)),
      Number(form.endTime.slice(3, 5)),
    );
    const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60_000));

    const recurrence = form.hasRecurrence
      ? {
          frequency: form.recurrenceFrequency,
          interval: form.recurrenceInterval,
          ...(form.recurrenceMode === 'count'
            ? { count: form.recurrenceCount }
            : { until: form.recurrenceUntil }),
        }
      : undefined;

    const neue: PIZeremonie = {
      id: bearbeiteteId ?? crypto.randomUUID(),
      type: form.type,
      title: form.title.trim(),
      // Schema 1.5 (legacy):
      date: form.startDate,
      startTime: form.startTime,
      durationMinutes,
      // Schema 1.6:
      startDate: form.startDate,
      endDate: form.endDate,
      endTime: form.endTime,
      ...(recurrence ? { recurrence } : {}),
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

  // Sortierung: nach Start-Datum + Start-Zeit aufsteigend
  const sortiert = [...zeremonien].sort((a, b) => {
    const aDate = a.startDate ?? a.date;
    const bDate = b.startDate ?? b.date;
    if (aDate !== bDate) return aDate < bDate ? -1 : 1;
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
              <th className="py-1 px-2 text-left font-medium">Start</th>
              <th className="py-1 px-2 text-left font-medium">Ende</th>
              <th className="py-1 px-2 text-left font-medium">Serie</th>
              <th className="py-1 px-2 text-left font-medium">Iter.</th>
              <th className="py-1 px-2 text-center font-medium">.ics</th>
              <th className="py-1 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortiert.map(z => {
              const startDate = z.startDate ?? z.date;
              const computed = addMinutes(startDate, z.startTime, z.durationMinutes);
              const endDate = z.endDate ?? computed.date;
              const endTime = z.endTime ?? computed.time;
              return (
                <tr key={z.id} className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
                  <td className="py-1 px-2">{ZEREMONIE_LABELS[z.type]}</td>
                  <td className="py-1 px-2">{z.title}</td>
                  <td className="py-1 px-2 whitespace-nowrap">{formatDateTimeShort(startDate, z.startTime)}</td>
                  <td className="py-1 px-2 whitespace-nowrap">{formatDateTimeShort(endDate, endTime)}</td>
                  <td className="py-1 px-2 whitespace-nowrap">
                    {z.recurrence ? (
                      <span className="inline-flex items-center gap-1 text-bund-blau">
                        <Repeat size={11} />
                        {formatRecurrence(z)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal: Zeremonie Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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

              {/* Start/Ende */}
              <div className="grid grid-cols-2 gap-3">
                <FormFeld
                  label="Start-Datum *"
                  value={form.startDate}
                  onChange={v => setForm(f => ({ ...f, startDate: v }))}
                  type="date"
                />
                <FormFeld
                  label="Start-Zeit *"
                  value={form.startTime}
                  onChange={v => setForm(f => ({ ...f, startTime: v }))}
                  type="time"
                />
                <FormFeld
                  label="Ende-Datum *"
                  value={form.endDate}
                  onChange={v => setForm(f => ({ ...f, endDate: v }))}
                  type="date"
                />
                <FormFeld
                  label="Ende-Zeit *"
                  value={form.endTime}
                  onChange={v => setForm(f => ({ ...f, endTime: v }))}
                  type="time"
                />
              </div>

              {/* Serie */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasRecurrence}
                    onChange={e => setForm(f => ({ ...f, hasRecurrence: e.target.checked }))}
                    className="cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <Repeat size={14} />
                    Terminserie (täglich / wöchentlich / monatlich)
                  </span>
                </label>
                {form.hasRecurrence && (
                  <div className="mt-3 space-y-2 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Häufigkeit</label>
                        <select
                          value={form.recurrenceFrequency}
                          onChange={e => setForm(f => ({ ...f, recurrenceFrequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' }))}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                        >
                          <option value="DAILY">Täglich</option>
                          <option value="WEEKLY">Wöchentlich</option>
                          <option value="MONTHLY">Monatlich</option>
                        </select>
                      </div>
                      <FormFeldZahl
                        label="Intervall (alle N)"
                        value={form.recurrenceInterval}
                        onChange={v => setForm(f => ({ ...f, recurrenceInterval: v }))}
                        min={1}
                        max={99}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Endet</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="recmode"
                            checked={form.recurrenceMode === 'count'}
                            onChange={() => setForm(f => ({ ...f, recurrenceMode: 'count' }))}
                          />
                          nach
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={form.recurrenceCount}
                          disabled={form.recurrenceMode !== 'count'}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10);
                            setForm(f => ({ ...f, recurrenceCount: Number.isFinite(n) ? n : 0 }));
                          }}
                          className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-bund-blau"
                        />
                        <span className="text-sm text-gray-600">Wiederholungen</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="recmode"
                            checked={form.recurrenceMode === 'until'}
                            onChange={() => setForm(f => ({ ...f, recurrenceMode: 'until' }))}
                          />
                          am
                        </label>
                        <input
                          type="date"
                          value={form.recurrenceUntil}
                          disabled={form.recurrenceMode !== 'until'}
                          onChange={e => setForm(f => ({ ...f, recurrenceUntil: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-bund-blau"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                {z?.recurrence && ' Die gesamte Serie wird entfernt.'}
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
