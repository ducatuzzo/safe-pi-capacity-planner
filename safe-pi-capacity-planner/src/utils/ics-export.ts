// Feature 29: .ics-Export für Zeremonien (RFC 5545 konform, client-side)
// Pure functions + ein Download-Helper. Kein Backend, kein npm-Paket.
// Schema 1.6 (Etappe 2): RRULE für Serien-Termine, DTSTART/DTEND aus startDate+endDate.

import type { PIPlanning, PIZeremonie, PIZeremonieRecurrence } from '../types';
import { ZEREMONIE_LABELS, effectiveZeremonieEnd } from './pi-calculator';

const PRODID = '-//BIT SAFe PI Capacity Planner//DE';
const UID_DOMAIN = 'safe-pi-capacity-planner.vercel.app';

// ─── Hilfs-Funktionen ────────────────────────────────────────────────────────

/** YYYYMMDDTHHMMSSZ (UTC, ohne Trennzeichen) — für DTSTAMP */
function nowUtcStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/**
 * Formatiert (YYYY-MM-DD, HH:mm) als "floating local time" (RFC 5545 §3.3.5)
 * im Format YYYYMMDDTHHMMSS – ohne TZ-Suffix.
 * Outlook/Apple/Google Calendar interpretieren das als Zeit im lokalen Kalender.
 */
function formatLocalDateTime(dateStr: string, timeStr: string): string {
  return `${dateStr.replace(/-/g, '')}T${timeStr.replace(/:/g, '')}00`;
}

/**
 * Schema 1.6: Generiert eine `RRULE`-Property aus einer `PIZeremonieRecurrence`.
 * RFC 5545 §3.8.5.3 / §3.3.10
 *
 * Regeln:
 *  - FREQ ist immer gesetzt
 *  - INTERVAL nur wenn > 1 (Default 1 wird weggelassen)
 *  - COUNT XOR UNTIL (recurrence-Schema garantiert das bereits)
 *  - UNTIL als floating local time (kein Z-Suffix), passend zu floatingem DTSTART
 *  - UNTIL setzt den Zeitpunkt auf 23:59:59 des angegebenen Tages
 */
function buildRrule(r: PIZeremonieRecurrence): string {
  const parts = [`FREQ=${r.frequency}`];
  if (r.interval && r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.count !== undefined) {
    parts.push(`COUNT=${r.count}`);
  } else if (r.until) {
    // Floating local time UNTIL: kein Z-Suffix
    parts.push(`UNTIL=${r.until.replace(/-/g, '')}T235959`);
  }
  return parts.join(';');
}

/** RFC 5545 §3.3.11: Backslashes, Kommas, Semikolons und Newlines escapen */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * RFC 5545 §3.1: Zeilen länger als 75 Oktette werden mit CRLF + " " gefoldet.
 * Konservative Implementierung pro Zeile, vor dem finalen CRLF-Join.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(rest);
  return parts.join('\r\n ');
}

// ─── Hauptfunktionen ─────────────────────────────────────────────────────────

/**
 * Generiert den ICS-Inhalt als String (RFC 5545, CRLF-getrennt).
 *
 * Schema 1.6:
 *  - DTSTART nutzt `startDate + startTime`, DTEND nutzt `endDate + endTime`
 *    (Schema-1.5-Daten via `effectiveZeremonieEnd()` Fallback)
 *  - Bei `recurrence` wird zusätzlich eine `RRULE`-Property eingefügt — Outlook,
 *    Google Calendar und Apple Calendar zeigen die Serie als einen Eintrag mit
 *    allen Wiederholungen automatisch.
 */
export function generateIcs(pi: PIPlanning, zeremonie: PIZeremonie): string {
  const startDate = zeremonie.startDate ?? zeremonie.date;
  const startTime = zeremonie.startTime;
  const { endDate, endTime } = effectiveZeremonieEnd(zeremonie);

  const dtstart = formatLocalDateTime(startDate, startTime);
  const dtend = formatLocalDateTime(endDate, endTime);

  const properties: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${zeremonie.id}@${UID_DOMAIN}`,
    `DTSTAMP:${nowUtcStamp()}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(`${zeremonie.title} (${pi.name})`)}`,
  ];

  // Schema 1.6: RRULE für Serien-Termine
  if (zeremonie.recurrence) {
    properties.push(`RRULE:${buildRrule(zeremonie.recurrence)}`);
  }

  if (zeremonie.description) {
    properties.push(`DESCRIPTION:${escapeText(zeremonie.description)}`);
  }
  if (zeremonie.location) {
    properties.push(`LOCATION:${escapeText(zeremonie.location)}`);
  }

  properties.push('END:VEVENT');
  properties.push('END:VCALENDAR');

  return properties.map(foldLine).join('\r\n') + '\r\n';
}

/** Slug für Dateinamen: Leerzeichen + Sonderzeichen → Bindestrich, ASCII-only */
function slug(value: string): string {
  return value
    .replace(/&/g, 'und')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Dateiname gemäss Spec: {PI-Name}_{Zeremonien-Typ-Label}_{Datum}.ics */
export function icsFilename(pi: PIPlanning, zeremonie: PIZeremonie): string {
  const typLabel = ZEREMONIE_LABELS[zeremonie.type];
  // Schema 1.6: startDate bevorzugen, sonst date (1.5-Fallback)
  const dateForFilename = zeremonie.startDate ?? zeremonie.date;
  return `${slug(pi.name)}_${slug(typLabel)}_${dateForFilename}.ics`;
}

/** Triggert einen Browser-Download des .ics-Files. */
export function downloadIcs(pi: PIPlanning, zeremonie: PIZeremonie): void {
  const inhalt = generateIcs(pi, zeremonie);
  const blob = new Blob([inhalt], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFilename(pi, zeremonie);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
