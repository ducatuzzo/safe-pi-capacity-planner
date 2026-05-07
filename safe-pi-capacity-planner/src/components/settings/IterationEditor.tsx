// Feature 29 v2 (Schema 1.6): Vereinte Timeline-Editor
// Iterationen + Blocker-Wochen + Zeremonien chronologisch sortiert in einer Tabelle.
// Zeremonien werden inline (nicht in separatem Fenster) angezeigt.

import { useState, Fragment } from 'react';
import { Pencil, Trash2, Plus, CalendarOff, Download, Repeat } from 'lucide-react';
import type { PIPlanning, Iteration, PIBlockerWeek, PIZeremonie, ZeremonieType } from '../../types';
import {
  calculateIterationDates,
  calculatePIEndDate,
  ZEREMONIE_LABELS,
  ZEREMONIE_DEFAULT_DURATION,
  ZEREMONIE_DEFAULT_START_TIME,
  addMinutes,
  effectiveZeremonieEnd,
} from '../../utils/pi-calculator';
import { downloadIcs } from '../../utils/ics-export';

interface Props {
  pi: PIPlanning;
  onPiChange: (updatedPi: PIPlanning) => void;
}

// ─── Form-States ──────────────────────────────────────────────────────────────

interface IterFormState {
  name: string;
  startStr: string;
  endStr: string;
}

interface BlockerFormState {
  afterIterationId: string;
  label: string;
  weeks: number;
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
  hasRecurrence: boolean;
  recurrenceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval: number;
  recurrenceMode: RecurrenceMode;
  recurrenceCount: number;
  recurrenceUntil: string;
}

const LEERE_ITERATION: IterFormState = { name: '', startStr: '', endStr: '' };
const LEERER_BLOCKER: BlockerFormState = { afterIterationId: '', label: '', weeks: 1 };

const ZEREMONIE_TYPES: ZeremonieType[] = [
  'PI_PLANNING', 'DRAFT_PLAN_REVIEW', 'FINAL_PLAN_REVIEW', 'PRIO_MEETING',
  'SYSTEM_DEMO', 'FINAL_SYSTEM_DEMO', 'INSPECT_ADAPT',
];

const FREQUENCY_LABEL: Record<'DAILY' | 'WEEKLY' | 'MONTHLY', string> = {
  DAILY: 'Täglich',
  WEEKLY: 'Wöchentlich',
  MONTHLY: 'Monatlich',
};

// ─── Validierungen ────────────────────────────────────────────────────────────

function validiereIteration(
  f: IterFormState,
  pi: PIPlanning,
  ausgeschlossenId: string | undefined,
  alleIterationen: Iteration[],
): string | null {
  if (!f.name.trim()) return 'Name ist erforderlich.';
  if (!f.startStr) return 'Startdatum ist erforderlich.';
  if (!f.endStr) return 'Enddatum ist erforderlich.';
  if (f.startStr >= f.endStr) return 'Startdatum muss vor dem Enddatum liegen.';
  if (f.startStr < pi.startStr) return `Startdatum muss innerhalb des PI-Zeitraums liegen (ab ${pi.startStr}).`;
  if (f.endStr > pi.endStr) return `Enddatum muss innerhalb des PI-Zeitraums liegen (bis ${pi.endStr}).`;
  for (const it of alleIterationen) {
    if (it.id === ausgeschlossenId) continue;
    if (f.startStr <= it.endStr && f.endStr >= it.startStr) {
      return `Überschneidung mit Iteration «${it.name}» (${it.startStr} – ${it.endStr}).`;
    }
  }
  return null;
}

function validiereBlocker(f: BlockerFormState, pi: PIPlanning): string | null {
  if (!f.afterIterationId) return 'Bitte Iteration auswählen.';
  if (!pi.iterationen.some(it => it.id === f.afterIterationId)) return 'Ungewählte Iteration ist ungültig.';
  if (!f.label.trim()) return 'Bezeichnung ist erforderlich.';
  if (f.weeks < 1 || f.weeks > 12) return 'Dauer muss zwischen 1 und 12 Wochen liegen.';
  return null;
}

function validiereZeremonie(f: ZeremonieFormState, pi: PIPlanning): string | null {
  if (!f.type) return 'Typ ist erforderlich.';
  if (!f.title.trim()) return 'Titel ist erforderlich.';
  if (!f.startDate) return 'Start-Datum ist erforderlich.';
  if (f.startDate < pi.startStr || f.startDate > pi.endStr) {
    return `Start-Datum muss innerhalb des PI-Zeitraums liegen (${pi.startStr} – ${pi.endStr}).`;
  }
  if (!f.startTime || !/^\d{2}:\d{2}$/.test(f.startTime)) return 'Start-Zeit muss im Format HH:MM sein.';
  if (!f.endDate) return 'Ende-Datum ist erforderlich.';
  if (!f.endTime || !/^\d{2}:\d{2}$/.test(f.endTime)) return 'Ende-Zeit muss im Format HH:MM sein.';
  if (f.endDate < f.startDate) return 'Ende-Datum muss am Start-Datum oder später liegen.';
  if (f.endDate === f.startDate && f.endTime <= f.startTime) {
    return 'Wenn Start- und Ende-Datum gleich sind, muss die Ende-Zeit nach der Start-Zeit liegen.';
  }
  if (f.hasRecurrence) {
    if (f.recurrenceInterval < 1 || f.recurrenceInterval > 99) return 'Serien-Intervall muss zwischen 1 und 99 liegen.';
    if (f.recurrenceMode === 'count') {
      if (f.recurrenceCount < 1 || f.recurrenceCount > 999) return 'Anzahl Wiederholungen muss zwischen 1 und 999 liegen.';
    } else {
      if (!f.recurrenceUntil || !/^\d{4}-\d{2}-\d{2}$/.test(f.recurrenceUntil)) return 'Serien-Enddatum ist erforderlich (YYYY-MM-DD).';
      if (f.recurrenceUntil < f.startDate) return 'Serien-Enddatum muss am Start-Datum oder später liegen.';
    }
  }
  return null;
}

// ─── Display-Helpers ──────────────────────────────────────────────────────────

function formatRecurrence(z: PIZeremonie): string {
  if (!z.recurrence) return '';
  const freq = FREQUENCY_LABEL[z.recurrence.frequency];
  const interval = z.recurrence.interval > 1 ? ` (alle ${z.recurrence.interval})` : '';
  if (z.recurrence.count !== undefined) return `${freq}${interval} × ${z.recurrence.count}`;
  if (z.recurrence.until) return `${freq}${interval} bis ${z.recurrence.until}`;
  return freq + interval;
}

// ─── Timeline-Item-Aufbau ─────────────────────────────────────────────────────

interface TimelineIterationItem {
  kind: 'iteration';
  sortKey: string;
  iter: Iteration;
}
interface TimelineBlockerItem {
  kind: 'blocker';
  sortKey: string;
  blocker: PIBlockerWeek;
  blockerStart: string; // = afterIter.endStr + 1 Tag
  blockerEnd: string;   // = blockerStart + weeks*7 - 1
  afterIterName: string;
}
interface TimelineZeremonieItem {
  kind: 'zeremonie';
  sortKey: string;
  zeremonie: PIZeremonie;
  startDate: string;
  endDate: string;
  endTime: string;
}
type TimelineItem = TimelineIterationItem | TimelineBlockerItem | TimelineZeremonieItem;

function nextDayStr(dateStr: string): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function addDaysStr(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function buildTimeline(pi: PIPlanning): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Iterationen
  pi.iterationen.forEach((it, idx) => {
    items.push({
      kind: 'iteration',
      sortKey: `${it.startStr}_1_${String(idx).padStart(3, '0')}`,
      iter: it,
    });
  });

  // Blocker-Wochen
  (pi.blockerWeeks ?? []).forEach(b => {
    const afterIter = pi.iterationen.find(it => it.id === b.afterIterationId);
    if (!afterIter) return;
    const blockerStart = nextDayStr(afterIter.endStr);
    const blockerEnd = addDaysStr(blockerStart, b.weeks * 7 - 1);
    items.push({
      kind: 'blocker',
      sortKey: `${blockerStart}_2`,
      blocker: b,
      blockerStart,
      blockerEnd,
      afterIterName: afterIter.name,
    });
  });

  // Zeremonien (in der Liste pro Stamm-Eintrag, nicht pro Serien-Instanz)
  (pi.zeremonien ?? []).forEach((z, idx) => {
    const startDate = z.startDate ?? z.date;
    const { endDate, endTime } = effectiveZeremonieEnd(z);
    items.push({
      kind: 'zeremonie',
      // Zeremonien zwischen Iter und Blocker einsortieren (Suffix '3')
      sortKey: `${startDate}_3_${String(idx).padStart(3, '0')}`,
      zeremonie: z,
      startDate,
      endDate,
      endTime,
    });
  });

  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

// ─── Komponente ────────────────────────────────────────────────────────────────

export default function IterationEditor({ pi, onPiChange }: Props) {
  // Iteration-Modal
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<IterFormState>({ ...LEERE_ITERATION });
  const [fehler, setFehler] = useState<string | null>(null);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);

  // Blocker-Modal
  const [blockerModalOffen, setBlockerModalOffen] = useState(false);
  const [blockerForm, setBlockerForm] = useState<BlockerFormState>({ ...LEERER_BLOCKER });
  const [blockerFehler, setBlockerFehler] = useState<string | null>(null);
  const [blockerLoescheId, setBlockerLoescheId] = useState<string | null>(null);

  // Zeremonien-Modal
  const [zerModalOffen, setZerModalOffen] = useState(false);
  const [zerBearbeiteteId, setZerBearbeiteteId] = useState<string | null>(null);
  const [zerForm, setZerForm] = useState<ZeremonieFormState>(zerLeeresFormular(pi));
  const [zerFehler, setZerFehler] = useState<string | null>(null);
  const [zerLoescheId, setZerLoescheId] = useState<string | null>(null);

  const blockerWeeks = pi.blockerWeeks ?? [];
  const zeremonien = pi.zeremonien ?? [];
  const istWochenbasiert = pi.iterationWeeks !== undefined && pi.iterationWeeks > 0;

  const timeline = buildTimeline(pi);

  // ─── Iteration-CRUD ─────────────────────────────────────────────────────────

  function oeffneNeu() {
    setForm({ ...LEERE_ITERATION });
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }
  function oeffneBearbeiten(it: Iteration) {
    setForm({ name: it.name, startStr: it.startStr, endStr: it.endStr });
    setBearbeiteteId(it.id);
    setFehler(null);
    setModalOffen(true);
  }
  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }
  function speichern() {
    const err = validiereIteration(form, pi, bearbeiteteId ?? undefined, pi.iterationen);
    if (err) { setFehler(err); return; }
    const neueIterationen = bearbeiteteId
      ? pi.iterationen.map(it => (it.id === bearbeiteteId ? { ...it, ...form } : it))
      : [...pi.iterationen, { id: crypto.randomUUID(), ...form }];
    onPiChange({ ...pi, iterationen: neueIterationen });
    schliesseModal();
  }
  function loeschenIteration(id: string) {
    const neueBlocker = blockerWeeks.filter(b => b.afterIterationId !== id);
    onPiChange({
      ...pi,
      iterationen: pi.iterationen.filter(it => it.id !== id),
      blockerWeeks: neueBlocker,
    });
    setLoescheIdBestaetigung(null);
  }

  // ─── Blocker-CRUD ───────────────────────────────────────────────────────────

  function oeffneBlockerNeu() {
    const ersteIterId = pi.iterationen[0]?.id ?? '';
    setBlockerForm({ ...LEERER_BLOCKER, afterIterationId: ersteIterId });
    setBlockerFehler(null);
    setBlockerModalOffen(true);
  }
  function schliesseBlockerModal() {
    setBlockerModalOffen(false);
    setBlockerFehler(null);
  }
  function wendeBlockerAn(neueBlocker: PIBlockerWeek[]) {
    if (!istWochenbasiert) return;
    const neueIterationen = calculateIterationDates({
      startDate: pi.startStr,
      iterationWeeks: pi.iterationWeeks!,
      iterations: pi.iterationen,
      blockerWeeks: neueBlocker,
    });
    onPiChange({
      ...pi,
      iterationen: neueIterationen,
      endStr: calculatePIEndDate(neueIterationen),
      blockerWeeks: neueBlocker,
    });
  }
  function speichereBlocker() {
    const err = validiereBlocker(blockerForm, pi);
    if (err) { setBlockerFehler(err); return; }
    const neuerBlocker: PIBlockerWeek = {
      id: crypto.randomUUID(),
      afterIterationId: blockerForm.afterIterationId,
      label: blockerForm.label.trim(),
      weeks: blockerForm.weeks,
    };
    wendeBlockerAn([...blockerWeeks, neuerBlocker]);
    schliesseBlockerModal();
  }
  function loescheBlocker(id: string) {
    wendeBlockerAn(blockerWeeks.filter(b => b.id !== id));
    setBlockerLoescheId(null);
  }

  // ─── Zeremonien-CRUD ────────────────────────────────────────────────────────

  function oeffneZerNeu() {
    setZerForm(zerLeeresFormular(pi));
    setZerBearbeiteteId(null);
    setZerFehler(null);
    setZerModalOffen(true);
  }
  function oeffneZerBearbeiten(z: PIZeremonie) {
    const startDate = z.startDate ?? z.date;
    const computed = addMinutes(startDate, z.startTime, z.durationMinutes);
    setZerForm({
      type: z.type,
      title: z.title,
      startDate,
      startTime: z.startTime,
      endDate: z.endDate ?? computed.date,
      endTime: z.endTime ?? computed.time,
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
    setZerBearbeiteteId(z.id);
    setZerFehler(null);
    setZerModalOffen(true);
  }
  function schliesseZerModal() {
    setZerModalOffen(false);
    setZerBearbeiteteId(null);
    setZerFehler(null);
  }
  function aendereZerTyp(neuerTyp: ZeremonieType) {
    setZerForm(f => {
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
  function speichereZer() {
    const err = validiereZeremonie(zerForm, pi);
    if (err) { setZerFehler(err); return; }
    const startMs = Date.UTC(
      Number(zerForm.startDate.slice(0, 4)),
      Number(zerForm.startDate.slice(5, 7)) - 1,
      Number(zerForm.startDate.slice(8, 10)),
      Number(zerForm.startTime.slice(0, 2)),
      Number(zerForm.startTime.slice(3, 5)),
    );
    const endMs = Date.UTC(
      Number(zerForm.endDate.slice(0, 4)),
      Number(zerForm.endDate.slice(5, 7)) - 1,
      Number(zerForm.endDate.slice(8, 10)),
      Number(zerForm.endTime.slice(0, 2)),
      Number(zerForm.endTime.slice(3, 5)),
    );
    const durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60_000));

    const recurrence = zerForm.hasRecurrence
      ? {
          frequency: zerForm.recurrenceFrequency,
          interval: zerForm.recurrenceInterval,
          ...(zerForm.recurrenceMode === 'count'
            ? { count: zerForm.recurrenceCount }
            : { until: zerForm.recurrenceUntil }),
        }
      : undefined;

    const neue: PIZeremonie = {
      id: zerBearbeiteteId ?? crypto.randomUUID(),
      type: zerForm.type,
      title: zerForm.title.trim(),
      date: zerForm.startDate,
      startTime: zerForm.startTime,
      durationMinutes,
      startDate: zerForm.startDate,
      endDate: zerForm.endDate,
      endTime: zerForm.endTime,
      ...(recurrence ? { recurrence } : {}),
      location: zerForm.location.trim(),
      description: zerForm.description.trim(),
      iterationId: zerForm.iterationId || undefined,
    };
    const neueListe = zerBearbeiteteId
      ? zeremonien.map(z => (z.id === zerBearbeiteteId ? neue : z))
      : [...zeremonien, neue];
    onPiChange({ ...pi, zeremonien: neueListe });
    schliesseZerModal();
  }
  function loescheZer(id: string) {
    onPiChange({ ...pi, zeremonien: zeremonien.filter(z => z.id !== id) });
    setZerLoescheId(null);
  }

  function iterationName(id?: string): string {
    if (!id) return '–';
    return pi.iterationen.find(it => it.id === id)?.name ?? '–';
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-bund-blau uppercase tracking-wide">
          Timeline – {pi.name}
        </span>
        <div className="flex gap-2">
          <button
            onClick={oeffneNeu}
            className="flex items-center gap-1 px-2 py-1 bg-bund-blau text-white text-xs rounded hover:bg-blue-900 transition-colors"
            title="Neue Iteration manuell anlegen"
          >
            <Plus size={13} />
            Iteration
          </button>
          <button
            onClick={oeffneBlockerNeu}
            disabled={!istWochenbasiert || pi.iterationen.length === 0}
            title={
              !istWochenbasiert
                ? 'Blocker-Wochen sind nur für wochenbasierte PIs verfügbar (iterationWeeks fehlt)'
                : 'Blocker-Woche nach einer Iteration einschieben'
            }
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CalendarOff size={13} />
            Blocker
          </button>
          <button
            onClick={oeffneZerNeu}
            className="flex items-center gap-1 px-2 py-1 bg-secondary-50 text-secondary-700 text-xs rounded hover:bg-secondary-100 transition-colors"
            title="Zeremonie hinzufügen (Einzeltermin oder Serie)"
            style={{ backgroundColor: '#FEF2F2', color: '#9E220C' }}
          >
            <Plus size={13} />
            Zeremonie
          </button>
        </div>
      </div>

      {timeline.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">
          Keine Iterationen, Blocker oder Zeremonien. Klicken Sie auf einen der Buttons oben.
        </p>
      ) : (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-blue-200 text-gray-600">
              <th className="py-1 px-2 text-left font-medium w-8"></th>
              <th className="py-1 px-2 text-left font-medium">Name / Titel</th>
              <th className="py-1 px-2 text-left font-medium">Start</th>
              <th className="py-1 px-2 text-left font-medium">Ende</th>
              <th className="py-1 px-2 text-left font-medium">Detail</th>
              <th className="py-1 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {timeline.map(item => {
              if (item.kind === 'iteration') {
                const it = item.iter;
                return (
                  <tr key={`iter-${it.id}`} className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
                    <td className="py-1 px-2 text-bund-blau font-bold text-center">I</td>
                    <td className="py-1 px-2 font-medium">{it.name}</td>
                    <td className="py-1 px-2 whitespace-nowrap">{it.startStr}</td>
                    <td className="py-1 px-2 whitespace-nowrap">{it.endStr}</td>
                    <td className="py-1 px-2 text-gray-500">Iteration</td>
                    <td className="py-1 px-2">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => oeffneBearbeiten(it)} className="p-0.5 text-gray-400 hover:text-bund-blau transition-colors" title="Bearbeiten">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setLoescheIdBestaetigung(it.id)} className="p-0.5 text-gray-400 hover:text-red-600 transition-colors" title="Löschen">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              if (item.kind === 'blocker') {
                const b = item.blocker;
                return (
                  <tr key={`blk-${b.id}`} className="bg-gray-100/70 border-b border-blue-100">
                    <td className="py-1 px-2 text-gray-500 text-center">
                      <CalendarOff size={12} className="inline" />
                    </td>
                    <td className="py-1 px-2 italic text-gray-600">BLOCKER: {b.label}</td>
                    <td className="py-1 px-2 whitespace-nowrap text-gray-600">{item.blockerStart}</td>
                    <td className="py-1 px-2 whitespace-nowrap text-gray-600">{item.blockerEnd}</td>
                    <td className="py-1 px-2 text-gray-500">
                      {b.weeks} {b.weeks === 1 ? 'Woche' : 'Wochen'} · nach {item.afterIterName}
                    </td>
                    <td className="py-1 px-2">
                      <div className="flex justify-end">
                        <button onClick={() => setBlockerLoescheId(b.id)} className="p-0.5 text-gray-400 hover:text-red-600 transition-colors" title="Blocker löschen">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              // Zeremonie
              const z = item.zeremonie;
              const istSerie = !!z.recurrence;
              return (
                <tr key={`zer-${z.id}`} className="border-b border-blue-100 hover:bg-secondary-50 transition-colors" style={{ backgroundColor: '#FFFAFA' }}>
                  <td className="py-1 px-2 text-center" style={{ color: '#E63312' }}>
                    {istSerie ? '◈' : '◆'}
                  </td>
                  <td className="py-1 px-2">
                    <span className="font-medium">{z.title}</span>
                    <span className="text-gray-500 ml-1">· {ZEREMONIE_LABELS[z.type]}</span>
                  </td>
                  <td className="py-1 px-2 whitespace-nowrap">{item.startDate} {z.startTime}</td>
                  <td className="py-1 px-2 whitespace-nowrap">{item.endDate} {item.endTime}</td>
                  <td className="py-1 px-2 text-gray-600 whitespace-nowrap">
                    {istSerie && (
                      <span className="inline-flex items-center gap-1 mr-2" style={{ color: '#9E220C' }}>
                        <Repeat size={11} />
                        {formatRecurrence(z)}
                      </span>
                    )}
                    {z.iterationId && <span>→ {iterationName(z.iterationId)}</span>}
                    {z.location && <span className="ml-1 text-gray-400">· {z.location}</span>}
                  </td>
                  <td className="py-1 px-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => downloadIcs(pi, z)} className="p-0.5 text-gray-400 hover:text-bund-blau transition-colors" title=".ics-Datei herunterladen">
                        <Download size={13} />
                      </button>
                      <button onClick={() => oeffneZerBearbeiten(z)} className="p-0.5 text-gray-400 hover:text-bund-blau transition-colors" title="Bearbeiten">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setZerLoescheId(z.id)} className="p-0.5 text-gray-400 hover:text-red-600 transition-colors" title="Löschen">
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

      {/* Modal: Iteration Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">
                {bearbeiteteId ? 'Iteration bearbeiten' : 'Neue Iteration'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">PI: {pi.name} ({pi.startStr} – {pi.endStr})</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <FormFeld label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <FormFeld label="Startdatum *" value={form.startStr} onChange={v => setForm(f => ({ ...f, startStr: v }))} type="date" />
                <FormFeld label="Enddatum *" value={form.endStr} onChange={v => setForm(f => ({ ...f, endStr: v }))} type="date" />
              </div>
            </div>
            {fehler && <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{fehler}</div>}
            <ModalFooter onAbbrechen={schliesseModal} onSpeichern={speichern} />
          </div>
        </div>
      )}

      {/* Modal: Blocker einfügen */}
      {blockerModalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">Blocker-Woche einfügen</h3>
              <p className="text-xs text-gray-500 mt-0.5">PI: {pi.name}</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nach Iteration *</label>
                <select
                  value={blockerForm.afterIterationId}
                  onChange={e => setBlockerForm(f => ({ ...f, afterIterationId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  {pi.iterationen.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </div>
              <FormFeld label="Bezeichnung *" value={blockerForm.label} onChange={v => setBlockerForm(f => ({ ...f, label: v }))} />
              <FormFeldZahl label="Dauer (Wochen) *" value={blockerForm.weeks} onChange={v => setBlockerForm(f => ({ ...f, weeks: v }))} min={1} max={12} />
              <p className="text-xs text-gray-500">
                Alle nachfolgenden Iterationen werden automatisch nach hinten verschoben.
              </p>
            </div>
            {blockerFehler && <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{blockerFehler}</div>}
            <ModalFooter onAbbrechen={schliesseBlockerModal} onSpeichern={speichereBlocker} speichernLabel="Einfügen" />
          </div>
        </div>
      )}

      {/* Modal: Zeremonie Neu / Bearbeiten */}
      {zerModalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">
                {zerBearbeiteteId ? 'Zeremonie bearbeiten' : 'Zeremonie hinzufügen'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">PI: {pi.name} ({pi.startStr} – {pi.endStr})</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Typ *</label>
                <select
                  value={zerForm.type}
                  onChange={e => aendereZerTyp(e.target.value as ZeremonieType)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  {ZEREMONIE_TYPES.map(t => <option key={t} value={t}>{ZEREMONIE_LABELS[t]}</option>)}
                </select>
              </div>
              <FormFeld label="Titel *" value={zerForm.title} onChange={v => setZerForm(f => ({ ...f, title: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <FormFeld label="Start-Datum *" value={zerForm.startDate} onChange={v => setZerForm(f => ({ ...f, startDate: v }))} type="date" />
                <FormFeld label="Start-Zeit *" value={zerForm.startTime} onChange={v => setZerForm(f => ({ ...f, startTime: v }))} type="time" />
                <FormFeld label="Ende-Datum *" value={zerForm.endDate} onChange={v => setZerForm(f => ({ ...f, endDate: v }))} type="date" />
                <FormFeld label="Ende-Zeit *" value={zerForm.endTime} onChange={v => setZerForm(f => ({ ...f, endTime: v }))} type="time" />
              </div>
              <div className="border border-gray-200 rounded p-3 bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zerForm.hasRecurrence}
                    onChange={e => setZerForm(f => ({ ...f, hasRecurrence: e.target.checked }))}
                    className="cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <Repeat size={14} />
                    Terminserie (täglich / wöchentlich / monatlich)
                  </span>
                </label>
                {zerForm.hasRecurrence && (
                  <div className="mt-3 space-y-2 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Häufigkeit</label>
                        <select
                          value={zerForm.recurrenceFrequency}
                          onChange={e => setZerForm(f => ({ ...f, recurrenceFrequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' }))}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                        >
                          <option value="DAILY">Täglich</option>
                          <option value="WEEKLY">Wöchentlich</option>
                          <option value="MONTHLY">Monatlich</option>
                        </select>
                      </div>
                      <FormFeldZahl
                        label="Intervall (alle N)"
                        value={zerForm.recurrenceInterval}
                        onChange={v => setZerForm(f => ({ ...f, recurrenceInterval: v }))}
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
                            checked={zerForm.recurrenceMode === 'count'}
                            onChange={() => setZerForm(f => ({ ...f, recurrenceMode: 'count' }))}
                          />
                          nach
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={zerForm.recurrenceCount}
                          disabled={zerForm.recurrenceMode !== 'count'}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10);
                            setZerForm(f => ({ ...f, recurrenceCount: Number.isFinite(n) ? n : 0 }));
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
                            checked={zerForm.recurrenceMode === 'until'}
                            onChange={() => setZerForm(f => ({ ...f, recurrenceMode: 'until' }))}
                          />
                          am
                        </label>
                        <input
                          type="date"
                          value={zerForm.recurrenceUntil}
                          disabled={zerForm.recurrenceMode !== 'until'}
                          onChange={e => setZerForm(f => ({ ...f, recurrenceUntil: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-bund-blau"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <FormFeld label="Ort / Link" value={zerForm.location} onChange={v => setZerForm(f => ({ ...f, location: v }))} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Beschreibung</label>
                <textarea
                  value={zerForm.description}
                  onChange={e => setZerForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Iteration (optional)</label>
                <select
                  value={zerForm.iterationId}
                  onChange={e => setZerForm(f => ({ ...f, iterationId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  <option value="">— keine Zuordnung —</option>
                  {pi.iterationen.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </div>
            </div>
            {zerFehler && <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">{zerFehler}</div>}
            <ModalFooter onAbbrechen={schliesseZerModal} onSpeichern={speichereZer} />
          </div>
        </div>
      )}

      {/* Bestätigungs-Dialoge */}
      {loescheIdBestaetigung && (
        <ConfirmDialog
          meldung={
            `Iteration «${pi.iterationen.find(it => it.id === loescheIdBestaetigung)?.name}» wirklich löschen?` +
            (blockerWeeks.some(b => b.afterIterationId === loescheIdBestaetigung) ? ' Zugehörige Blocker-Wochen werden ebenfalls entfernt.' : '')
          }
          onAbbrechen={() => setLoescheIdBestaetigung(null)}
          onBestaetigen={() => loeschenIteration(loescheIdBestaetigung)}
        />
      )}
      {blockerLoescheId && (
        <ConfirmDialog
          meldung={`Blocker-Woche «${blockerWeeks.find(b => b.id === blockerLoescheId)?.label}» wirklich entfernen? Iterationen werden neu berechnet.`}
          onAbbrechen={() => setBlockerLoescheId(null)}
          onBestaetigen={() => loescheBlocker(blockerLoescheId)}
          buttonLabel="Entfernen"
        />
      )}
      {zerLoescheId && (() => {
        const z = zeremonien.find(z => z.id === zerLoescheId);
        return (
          <ConfirmDialog
            meldung={`Zeremonie «${z?.title}» wirklich löschen?` + (z?.recurrence ? ' Die gesamte Serie wird entfernt.' : '')}
            onAbbrechen={() => setZerLoescheId(null)}
            onBestaetigen={() => loescheZer(zerLoescheId)}
          />
        );
      })()}
    </div>
  );
}

// ─── Sub-Komponenten + Helper ─────────────────────────────────────────────────

function zerLeeresFormular(pi: PIPlanning): ZeremonieFormState {
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

interface ModalFooterProps {
  onAbbrechen: () => void;
  onSpeichern: () => void;
  speichernLabel?: string;
}
function ModalFooter({ onAbbrechen, onSpeichern, speichernLabel = 'Speichern' }: ModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
      <button onClick={onAbbrechen} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        Abbrechen
      </button>
      <button onClick={onSpeichern} className="px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors">
        {speichernLabel}
      </button>
    </div>
  );
}

interface ConfirmDialogProps {
  meldung: string;
  onAbbrechen: () => void;
  onBestaetigen: () => void;
  buttonLabel?: string;
}
function ConfirmDialog({ meldung, onAbbrechen, onBestaetigen, buttonLabel = 'Löschen' }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <p className="text-sm text-gray-700 mb-6">{meldung}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onAbbrechen} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Abbrechen
          </button>
          <button onClick={onBestaetigen} className="px-4 py-2 text-sm bg-bund-blau text-white rounded hover:bg-blue-900 transition-colors">
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Vermeide unused-import-Warning (Fragment importiert für ggf. zukünftige Erweiterung)
void Fragment;
