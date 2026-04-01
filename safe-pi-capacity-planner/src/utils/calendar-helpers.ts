// Hilfsfunktionen für den Kalender-View

import type { AppData, PIPlanning } from '../types';

// ─── Typen ────────────────────────────────────────────────────────────────────

export type DayType = 'wochenende' | 'feiertag' | 'schulferien' | 'blocker' | 'normal';

export interface DayMeta {
  type: DayType;
  tooltip?: string;
}

export interface HeaderSpan {
  label: string;
  span: number;
}

// ─── Datum-Utilities ──────────────────────────────────────────────────────────

/** Parst einen YYYY-MM-DD String als UTC-Mitternacht */
export function parseUTC(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

/** Formatiert ein UTC-Datum als YYYY-MM-DD */
export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** ISO-Kalenderwoche (1–53) */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** ISO-Jahr der Kalenderwoche (kann in KW1/53 vom Kalenderjahr abweichen) */
function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/** Wochentag-Abkürzung auf Deutsch (Mo, Di, Mi, Do, Fr, Sa, So) */
export function getWeekdayLabel(date: Date): string {
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getUTCDay()];
}

/** Monatsname kurz auf Deutsch mit Jahr (z.B. "Mär 2026") */
export function getMonthLabel(date: Date): string {
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// ─── Tagesbereiche ────────────────────────────────────────────────────────────

/** Alle Tage zwischen startStr und endStr (inkl.), als UTC-Objekte */
export function getDaysInRange(startStr: string, endStr: string): Date[] {
  const days: Date[] = [];
  const start = parseUTC(startStr);
  const end = parseUTC(endStr);
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/** Arbeitstage (Mo–Fr) ohne Feiertage im angegebenen Zeitraum */
export function getWorkingDays(
  startStr: string,
  endStr: string,
  feiertage: { startStr: string; endStr: string }[]
): Date[] {
  return getDaysInRange(startStr, endStr).filter(d => {
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) return false;
    const ds = toDateStr(d);
    return !feiertage.some(f => ds >= f.startStr && ds <= f.endStr);
  });
}

// ─── Tagesmetadaten ───────────────────────────────────────────────────────────

/** Priorität: Wochenende > Blocker > Feiertag > Schulferien > Normal */
export function getDayMeta(date: Date, appData: AppData): DayMeta {
  const ds = toDateStr(date);
  const dow = date.getUTCDay();

  if (dow === 0 || dow === 6) return { type: 'wochenende' };

  const blocker = appData.blocker.find(b => ds >= b.startStr && ds <= b.endStr);
  if (blocker) return { type: 'blocker', tooltip: blocker.name };

  const feiertag = appData.feiertage.find(f => ds >= f.startStr && ds <= f.endStr);
  if (feiertag) return { type: 'feiertag', tooltip: feiertag.name };

  const schulferien = appData.schulferien.find(s => ds >= s.startStr && ds <= s.endStr);
  if (schulferien) return { type: 'schulferien', tooltip: schulferien.name };

  return { type: 'normal' };
}

// ─── Header-Gruppierung ───────────────────────────────────────────────────────

/** Gruppiert konsekutive Tage mit gleichem Key in Spans (für colspan im Header) */
function groupByKey(
  days: Date[],
  keyFn: (d: Date) => string,
  labelFn: (d: Date) => string
): HeaderSpan[] {
  const spans: HeaderSpan[] = [];
  let currentKey: string | null = null;
  for (const day of days) {
    const key = keyFn(day);
    if (key !== currentKey) {
      spans.push({ label: labelFn(day), span: 1 });
      currentKey = key;
    } else {
      spans[spans.length - 1].span++;
    }
  }
  return spans;
}

export function groupByMonth(days: Date[]): HeaderSpan[] {
  return groupByKey(
    days,
    d => `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
    d => getMonthLabel(d)
  );
}

export function groupByKW(days: Date[]): HeaderSpan[] {
  return groupByKey(
    days,
    d => `${getISOWeekYear(d)}-${getISOWeek(d)}`,
    d => `KW\u00A0${getISOWeek(d)}`
  );
}

export function groupByPI(days: Date[], pis: PIPlanning[]): HeaderSpan[] {
  return groupByKey(
    days,
    d => {
      const ds = toDateStr(d);
      return pis.find(p => ds >= p.startStr && ds <= p.endStr)?.id ?? '';
    },
    d => {
      const ds = toDateStr(d);
      return pis.find(p => ds >= p.startStr && ds <= p.endStr)?.name ?? '';
    }
  );
}

export function groupByIteration(days: Date[], pis: PIPlanning[]): HeaderSpan[] {
  return groupByKey(
    days,
    d => {
      const ds = toDateStr(d);
      for (const pi of pis) {
        const iter = pi.iterationen.find(i => ds >= i.startStr && ds <= i.endStr);
        if (iter) return iter.id;
        // Fallback: PI selbst als Einzel-Span wenn keine Iterationen definiert
        if (ds >= pi.startStr && ds <= pi.endStr) return pi.id;
      }
      return '';
    },
    d => {
      const ds = toDateStr(d);
      for (const pi of pis) {
        const iter = pi.iterationen.find(i => ds >= i.startStr && ds <= i.endStr);
        if (iter) return iter.name;
        // Fallback: PI-Name anzeigen
        if (ds >= pi.startStr && ds <= pi.endStr) return pi.name;
      }
      return '';
    }
  );
}
