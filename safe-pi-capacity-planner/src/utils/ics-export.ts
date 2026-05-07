// Feature 29: .ics-Export für Zeremonien (RFC 5545 konform, client-side)
// Pure functions + ein Download-Helper. Kein Backend, kein npm-Paket.

import type { PIPlanning, PIZeremonie } from '../types';
import { ZEREMONIE_LABELS } from './pi-calculator';

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
 * Berechnet DTSTART/DTEND als "floating local time" (RFC 5545 §3.3.5)
 * im Format YYYYMMDDTHHMMSS – ohne TZ-Suffix, ohne UTC-Konvertierung.
 * Outlook/Apple/Google Calendar interpretieren das als Zeit im lokalen Kalender des Empfängers.
 */
function buildDateTimes(date: string, startTime: string, durationMinutes: number): { start: string; end: string } {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = startTime.split(':').map(Number);
  const startMs = Date.UTC(y, mo - 1, d, h, mi, 0);
  const endMs = startMs + durationMinutes * 60_000;

  const fmt = (ms: number) => {
    const dt = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
      `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}`
    );
  };

  return { start: fmt(startMs), end: fmt(endMs) };
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

/** Generiert den ICS-Inhalt als String (RFC 5545, CRLF-getrennt). */
export function generateIcs(pi: PIPlanning, zeremonie: PIZeremonie): string {
  const { start, end } = buildDateTimes(zeremonie.date, zeremonie.startTime, zeremonie.durationMinutes);

  const properties: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${zeremonie.id}@${UID_DOMAIN}`,
    `DTSTAMP:${nowUtcStamp()}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(`${zeremonie.title} (${pi.name})`)}`,
  ];

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
  return `${slug(pi.name)}_${slug(typLabel)}_${zeremonie.date}.ics`;
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
