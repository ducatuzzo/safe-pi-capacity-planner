import type { Employee, CustomAllocationType } from '../types';
import { BUILTIN_SET, ALLOCATION_LETTER } from './allocation-helpers';

export interface ClipboardBooking {
  employeeId: string;
  dateStr: string;
  allocationType: string;
}

export interface ClipboardParseResult {
  bookings: ClipboardBooking[];
  matchedEmployees: number;
  unmatchedEmployees: string[];
  unknownKuerzel: string[];
  dateParseErrors: string[];
  mode: 'structured' | 'raw';
}

const KUERZEL_TO_BUILTIN: Record<string, string> = {};
for (const [builtinId, letter] of Object.entries(ALLOCATION_LETTER)) {
  if (letter && builtinId !== 'NONE') {
    KUERZEL_TO_BUILTIN[letter.toUpperCase()] = builtinId;
  }
}

function parseDateHeader(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${m}-${d}`;
  }

  const dmNoYear = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
  if (dmNoYear) {
    const d = dmNoYear[1].padStart(2, '0');
    const m = dmNoYear[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${m}-${d}`;
  }

  return null;
}

function matchEmployee(name: string, employees: Employee[]): Employee | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const exact = employees.find(e =>
    `${e.vorname} ${e.name}`.toLowerCase() === lower ||
    `${e.name} ${e.vorname}`.toLowerCase() === lower
  );
  if (exact) return exact;

  const byNachname = employees.filter(e => e.name.toLowerCase() === lower);
  if (byNachname.length === 1) return byNachname[0];

  const byVorname = employees.filter(e => e.vorname.toLowerCase() === lower);
  if (byVorname.length === 1) return byVorname[0];

  return null;
}

export function resolveKuerzel(
  kuerzel: string,
  customTypes: CustomAllocationType[],
): string | null {
  const upper = kuerzel.trim().toUpperCase();
  if (!upper) return null;

  if (KUERZEL_TO_BUILTIN[upper]) return KUERZEL_TO_BUILTIN[upper];
  if (BUILTIN_SET.has(upper) && upper !== 'NONE') return upper;

  const custom = customTypes.find(ct => ct.kuerzel.toUpperCase() === upper);
  if (custom) return custom.id;

  const customById = customTypes.find(ct => ct.id.toUpperCase() === upper);
  if (customById) return customById.id;

  return null;
}

function hasDateHeaders(cells: string[]): boolean {
  let dateCount = 0;
  for (const cell of cells) {
    if (parseDateHeader(cell)) dateCount++;
  }
  return dateCount >= 2;
}

function isKuerzelLike(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= 3 && /^[a-zA-Z0-9]*$/.test(trimmed);
}

/**
 * Structured mode: first row = date headers, first column = employee names.
 */
function parseStructured(
  lines: string[],
  employees: Employee[],
  customTypes: CustomAllocationType[],
): ClipboardParseResult {
  const headerCells = lines[0].split('\t');
  const dates: (string | null)[] = [];
  const dateParseErrors: string[] = [];
  for (let i = 1; i < headerCells.length; i++) {
    const parsed = parseDateHeader(headerCells[i]);
    if (!parsed && headerCells[i].trim()) {
      dateParseErrors.push(headerCells[i].trim());
    }
    dates.push(parsed);
  }

  const bookings: ClipboardBooking[] = [];
  const unmatchedEmployees: string[] = [];
  const unknownKuerzelSet = new Set<string>();
  const matchedEmployeeIds = new Set<string>();

  for (let row = 1; row < lines.length; row++) {
    const cells = lines[row].split('\t');
    const employeeName = cells[0]?.trim();
    if (!employeeName) continue;

    const emp = matchEmployee(employeeName, employees);
    if (!emp) {
      unmatchedEmployees.push(employeeName);
      continue;
    }
    matchedEmployeeIds.add(emp.id);

    for (let col = 1; col < cells.length; col++) {
      const dateStr = dates[col - 1];
      if (!dateStr) continue;
      const cellValue = cells[col]?.trim();
      if (!cellValue) continue;
      const allocType = resolveKuerzel(cellValue, customTypes);
      if (!allocType) {
        unknownKuerzelSet.add(cellValue);
        continue;
      }
      bookings.push({ employeeId: emp.id, dateStr, allocationType: allocType });
    }
  }

  return {
    bookings,
    matchedEmployees: matchedEmployeeIds.size,
    unmatchedEmployees,
    unknownKuerzel: [...unknownKuerzelSet],
    dateParseErrors,
    mode: 'structured',
  };
}

/**
 * Raw mode: no date headers, no employee names.
 * Columns map to visibleDays, rows map to visibleEmployees (in order).
 */
function parseRaw(
  lines: string[],
  visibleEmployees: Employee[],
  visibleDateStrs: string[],
  customTypes: CustomAllocationType[],
): ClipboardParseResult {
  const bookings: ClipboardBooking[] = [];
  const unknownKuerzelSet = new Set<string>();
  const matchedEmployeeIds = new Set<string>();

  for (let row = 0; row < lines.length; row++) {
    if (row >= visibleEmployees.length) break;
    const emp = visibleEmployees[row];
    const cells = lines[row].split('\t');

    for (let col = 0; col < cells.length; col++) {
      if (col >= visibleDateStrs.length) break;
      const cellValue = cells[col]?.trim();
      if (!cellValue) continue;
      const allocType = resolveKuerzel(cellValue, customTypes);
      if (!allocType) {
        unknownKuerzelSet.add(cellValue);
        continue;
      }
      matchedEmployeeIds.add(emp.id);
      bookings.push({ employeeId: emp.id, dateStr: visibleDateStrs[col], allocationType: allocType });
    }
  }

  return {
    bookings,
    matchedEmployees: matchedEmployeeIds.size,
    unmatchedEmployees: [],
    unknownKuerzel: [...unknownKuerzelSet],
    dateParseErrors: [],
    mode: 'raw',
  };
}

/**
 * Main entry point. Auto-detects structured vs raw mode.
 * - Structured: first row has parseable dates → classic header-based import
 * - Raw: no dates detected → map columns to visible days, rows to visible employees
 */
export function parseClipboardTSV(
  text: string,
  employees: Employee[],
  customTypes: CustomAllocationType[],
  visibleEmployees?: Employee[],
  visibleDateStrs?: string[],
): ClipboardParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) {
    return { bookings: [], matchedEmployees: 0, unmatchedEmployees: [], unknownKuerzel: [], dateParseErrors: [], mode: 'raw' };
  }

  const firstRowCells = lines[0].split('\t');

  // Detect mode: does the first row contain date headers?
  if (lines.length >= 2 && hasDateHeaders(firstRowCells)) {
    return parseStructured(lines, employees, customTypes);
  }

  // Check if first column looks like employee names (not kürzels)
  // If first cell is longer than 3 chars or contains spaces → might be structured without dates
  const firstCell = firstRowCells[0]?.trim() ?? '';
  if (lines.length >= 2 && firstCell.length > 3 && !isKuerzelLike(firstCell)) {
    const emp = matchEmployee(firstCell, employees);
    if (emp) {
      // First column has employee names but no date headers →
      // treat as structured but warn about missing dates
      return parseStructured(lines, employees, customTypes);
    }
  }

  // Raw mode: just kürzels, map to visible calendar
  if (visibleEmployees && visibleDateStrs && visibleEmployees.length > 0 && visibleDateStrs.length > 0) {
    return parseRaw(lines, visibleEmployees, visibleDateStrs, customTypes);
  }

  // Fallback: can't parse without context
  return { bookings: [], matchedEmployees: 0, unmatchedEmployees: [], unknownKuerzel: [], dateParseErrors: [], mode: 'raw' };
}
