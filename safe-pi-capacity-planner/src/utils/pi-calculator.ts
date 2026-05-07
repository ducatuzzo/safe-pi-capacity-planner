// Feature 29: PI-Berechnungslogik – pure functions
// Wochenbasierte Iterations-Generierung, Blocker-Wochen-Verschiebung, Zeremonien-Defaults
// Schema 1.6: addMinutes() + expandRecurrence() für Serien-Termine

import type { Iteration, PIBlockerWeek, PIZeremonie, ZeremonieType } from '../types';
import { parseUTC, toDateStr } from './calendar-helpers';

// ─── Zeremonien-Defaults ──────────────────────────────────────────────────────

/** Anzeige-Labels für Zeremonien-Typen (Deutsch) */
export const ZEREMONIE_LABELS: Record<ZeremonieType, string> = {
  PI_PLANNING: 'PI Planning',
  DRAFT_PLAN_REVIEW: 'Draft Plan Review',
  FINAL_PLAN_REVIEW: 'Final Plan Review',
  PRIO_MEETING: 'Prio-Meeting',
  SYSTEM_DEMO: 'System Demo',
  FINAL_SYSTEM_DEMO: 'Final System Demo',
  INSPECT_ADAPT: 'Inspect & Adapt',
};

/** Default-Dauer in Minuten pro Zeremonien-Typ */
export const ZEREMONIE_DEFAULT_DURATION: Record<ZeremonieType, number> = {
  PI_PLANNING: 960,        // 2 Tage à 8 Std.
  DRAFT_PLAN_REVIEW: 60,
  FINAL_PLAN_REVIEW: 60,
  PRIO_MEETING: 120,
  SYSTEM_DEMO: 120,
  FINAL_SYSTEM_DEMO: 120,
  INSPECT_ADAPT: 240,
};

/** Default-Startzeit pro Zeremonien-Typ (HH:mm) */
export const ZEREMONIE_DEFAULT_START_TIME: Record<ZeremonieType, string> = {
  PI_PLANNING: '09:00',
  DRAFT_PLAN_REVIEW: '14:00',
  FINAL_PLAN_REVIEW: '14:00',
  PRIO_MEETING: '10:00',
  SYSTEM_DEMO: '14:00',
  FINAL_SYSTEM_DEMO: '14:00',
  INSPECT_ADAPT: '09:00',
};

// ─── Datum-Helpers ────────────────────────────────────────────────────────────

/** Addiert ganze Tage zu einem YYYY-MM-DD Datum */
function addDays(dateStr: string, days: number): string {
  const d = parseUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

// ─── Iterations-Generierung ───────────────────────────────────────────────────

export interface IterationsCalcInput {
  startDate: string;             // PI-Startdatum (YYYY-MM-DD)
  iterationWeeks: number;        // 1–6
  /**
   * Entweder die Anzahl Iterationen (frische Generierung mit neuen IDs)
   * oder bestehende Iterationen (Re-Berechnung der Daten, IDs/Namen bleiben)
   */
  iterations: number | Iteration[];
  blockerWeeks?: PIBlockerWeek[];
}

/**
 * Berechnet Start- und Enddatum aller Iterationen anhand:
 *  - PI-Startdatum
 *  - Wochen pro Iteration
 *  - Optionaler Blocker-Wochen, die nach einer Iteration eingeschoben werden
 *
 * Regel: Blocker nach Iteration X verschieben alle Iterationen X+1..N um (weeks * 7) Tage.
 * Das PI-Enddatum ergibt sich aus der letzten Iteration.
 */
export function calculateIterationDates(input: IterationsCalcInput): Iteration[] {
  const { startDate, iterationWeeks, iterations, blockerWeeks = [] } = input;

  if (iterationWeeks < 1 || iterationWeeks > 6) {
    throw new Error(`iterationWeeks muss zwischen 1 und 6 liegen (war: ${iterationWeeks})`);
  }

  // Quelle für IDs/Namen bestimmen
  const source: Iteration[] =
    typeof iterations === 'number'
      ? Array.from({ length: iterations }, (_, i) => ({
          id: crypto.randomUUID(),
          name: `I${i + 1}`,
          startStr: '',
          endStr: '',
        }))
      : iterations.map(it => ({ ...it }));

  if (source.length === 0) return [];

  const lengthDays = iterationWeeks * 7;
  const result: Iteration[] = [];
  let cursor = startDate;

  for (let i = 0; i < source.length; i++) {
    const iterStart = cursor;
    const iterEnd = addDays(iterStart, lengthDays - 1);
    result.push({
      ...source[i],
      startStr: iterStart,
      endStr: iterEnd,
    });

    // Cursor auf Tag nach Iteration setzen
    cursor = addDays(iterEnd, 1);

    // Blocker nach dieser Iteration einschieben?
    const blocker = blockerWeeks.find(b => b.afterIterationId === source[i].id);
    if (blocker && blocker.weeks > 0) {
      cursor = addDays(cursor, blocker.weeks * 7);
    }
  }

  return result;
}

/** Berechnet das PI-Enddatum aus der letzten Iteration. Leer-Array → leerer String. */
export function calculatePIEndDate(iterations: Iteration[]): string {
  if (iterations.length === 0) return '';
  return iterations[iterations.length - 1].endStr;
}

/** Prüft ob ein Datum ein Montag ist (für Validierung des PI-Startdatums) */
export function isMonday(dateStr: string): boolean {
  return parseUTC(dateStr).getUTCDay() === 1;
}

// ─── Schema 1.6: Datum/Uhrzeit-Arithmetik für Zeremonien ─────────────────────

/**
 * Addiert eine Minutenzahl zu (dateStr YYYY-MM-DD, timeStr HH:mm) und gibt
 * { date, time } zurück. Tagesübergreifend (z.B. PI Planning 09:00 + 960 Min).
 */
export function addMinutes(
  dateStr: string,
  timeStr: string,
  minutes: number,
): { date: string; time: string } {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const ms = Date.UTC(y, mo - 1, d, h, mi, 0) + minutes * 60_000;
  const dt = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
    time: `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`,
  };
}

/** Addiert eine Frequenz-Periode (DAILY/WEEKLY/MONTHLY × interval) zu einem Datum */
function addPeriod(
  dateStr: string,
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  interval: number,
): string {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (freq === 'DAILY') dt.setUTCDate(dt.getUTCDate() + interval);
  else if (freq === 'WEEKLY') dt.setUTCDate(dt.getUTCDate() + interval * 7);
  else if (freq === 'MONTHLY') dt.setUTCMonth(dt.getUTCMonth() + interval);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Eine Termin-Instanz (auch für Nicht-Serien-Termine) */
export interface ZeremonieInstanz {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  /** 1-basierter Index (1 = Original, 2..N = Wiederholungen) */
  occurrence: number;
  /** Gesamtanzahl Instanzen (für Tooltip „Termin 3/5") */
  total: number;
}

/**
 * Maximum hard cap für Serien-Expansion (Sicherheit gegen User-Eingabefehler
 * wie z.B. „täglich, until=2099-12-31").
 */
const MAX_RECURRENCE_INSTANCES = 1000;

/**
 * Expandiert eine Zeremonie zu einer Liste von Termin-Instanzen.
 * Bei einem Nicht-Serien-Termin: Liste mit einer Instanz.
 * Bei einer Serie: Liste mit `recurrence.count` Instanzen oder bis `recurrence.until`.
 *
 * Felder werden mit Fallback aus 1.5-Schema gelesen (für Daten, die noch nicht
 * via state-migration auf 1.6 gehoben wurden).
 */
export function expandRecurrence(zeremonie: PIZeremonie): ZeremonieInstanz[] {
  // Felder mit Fallback auf Schema 1.5
  const startDate = zeremonie.startDate ?? zeremonie.date;
  const startTime = zeremonie.startTime;
  const computedEnd = addMinutes(startDate, startTime, zeremonie.durationMinutes);
  const endDate = zeremonie.endDate ?? computedEnd.date;
  const endTime = zeremonie.endTime ?? computedEnd.time;

  const r = zeremonie.recurrence;
  if (!r) {
    return [{ startDate, startTime, endDate, endTime, occurrence: 1, total: 1 }];
  }

  const interval = r.interval || 1;
  const maxCount = Math.min(r.count ?? MAX_RECURRENCE_INSTANCES, MAX_RECURRENCE_INSTANCES);

  // Distanz Start → Ende in Tagen (für mehrtägige Termine)
  const startMs = Date.UTC(
    Number(startDate.slice(0, 4)),
    Number(startDate.slice(5, 7)) - 1,
    Number(startDate.slice(8, 10)),
  );
  const endMs = Date.UTC(
    Number(endDate.slice(0, 4)),
    Number(endDate.slice(5, 7)) - 1,
    Number(endDate.slice(8, 10)),
  );
  const durationDays = Math.round((endMs - startMs) / 86_400_000);

  // Erst alle Start-Daten sammeln
  const startDates: string[] = [startDate];
  let cursor = startDate;
  for (let i = 1; i < maxCount; i++) {
    const next = addPeriod(cursor, r.frequency, interval);
    if (r.until && next > r.until) break;
    startDates.push(next);
    cursor = next;
  }

  const total = startDates.length;
  return startDates.map((sd, idx) => {
    const ed = durationDays === 0 ? sd : addPeriod(sd, 'DAILY', durationDays);
    return {
      startDate: sd,
      startTime,
      endDate: ed,
      endTime,
      occurrence: idx + 1,
      total,
    };
  });
}

/**
 * Schema-1.6-Hilfsfunktion: liefert effektives endDate/endTime einer Zeremonie
 * (nutzt 1.6-Felder wenn gesetzt, sonst Berechnung aus 1.5-durationMinutes).
 */
export function effectiveZeremonieEnd(z: PIZeremonie): { endDate: string; endTime: string } {
  if (z.endDate && z.endTime) return { endDate: z.endDate, endTime: z.endTime };
  const c = addMinutes(z.startDate ?? z.date, z.startTime, z.durationMinutes);
  return { endDate: c.date, endTime: c.time };
}
