// Feature 29: PI-Berechnungslogik – pure functions
// Wochenbasierte Iterations-Generierung, Blocker-Wochen-Verschiebung, Zeremonien-Defaults

import type { Iteration, PIBlockerWeek, ZeremonieType } from '../types';
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
