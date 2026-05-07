// Feature 29: Excel-Workbook Export/Import für PI-Planung (für RTE)
// 4 Sheets: PIs, Iterationen, Blocker-Wochen, Zeremonien
// Iter-Namen-basiertes Mapping (stabiler als ID-basiert beim Round-Trip)

import * as XLSX from 'xlsx';
import type { PIPlanning, Iteration, PIBlockerWeek, PIZeremonie, ZeremonieType } from '../types';

// ─── Sheet-Namen + Spalten ────────────────────────────────────────────────────

const SHEET_PIS = 'PIs';
const SHEET_ITERATIONEN = 'Iterationen';
const SHEET_BLOCKER = 'Blocker-Wochen';
const SHEET_ZEREMONIEN = 'Zeremonien';

// Header-Definitionen (case-sensitive beim Schreiben, case-insensitive beim Lesen)
const HEADERS_PIS = ['name', 'startStr', 'endStr', 'iterationWeeks'] as const;
const HEADERS_ITERATIONEN = ['piName', 'iterName', 'startStr', 'endStr'] as const;
const HEADERS_BLOCKER = ['piName', 'afterIterName', 'label', 'weeks'] as const;
const HEADERS_ZEREMONIEN = [
  'piName', 'type', 'title', 'date', 'startTime', 'durationMinutes',
  'location', 'description', 'iterName',
] as const;

const ZEREMONIE_TYPES: readonly ZeremonieType[] = [
  'PI_PLANNING', 'DRAFT_PLAN_REVIEW', 'FINAL_PLAN_REVIEW', 'PRIO_MEETING',
  'SYSTEM_DEMO', 'FINAL_SYSTEM_DEMO', 'INSPECT_ADAPT',
];

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Generiert ein Excel-Workbook mit allen PI-Daten und triggert den Browser-Download.
 * Iter-Namen werden für die Querverweise (afterIterName, iterName) verwendet — stabiler
 * als IDs für manuelle RTE-Bearbeitung.
 */
export function downloadPiXlsx(pis: PIPlanning[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: PIs
  const piRows = pis.map(pi => ({
    name: pi.name,
    startStr: pi.startStr,
    endStr: pi.endStr,
    iterationWeeks: pi.iterationWeeks ?? '',
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(piRows, { header: [...HEADERS_PIS] }),
    SHEET_PIS,
  );

  // Sheet 2: Iterationen (denormalisiert mit piName)
  const iterRows = pis.flatMap(pi =>
    pi.iterationen.map(it => ({
      piName: pi.name,
      iterName: it.name,
      startStr: it.startStr,
      endStr: it.endStr,
    })),
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(iterRows, { header: [...HEADERS_ITERATIONEN] }),
    SHEET_ITERATIONEN,
  );

  // Sheet 3: Blocker-Wochen (afterIterName statt afterIterationId)
  const blockerRows = pis.flatMap(pi =>
    (pi.blockerWeeks ?? []).map(b => {
      const afterIter = pi.iterationen.find(it => it.id === b.afterIterationId);
      return {
        piName: pi.name,
        afterIterName: afterIter?.name ?? '',
        label: b.label,
        weeks: b.weeks,
      };
    }),
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(blockerRows, { header: [...HEADERS_BLOCKER] }),
    SHEET_BLOCKER,
  );

  // Sheet 4: Zeremonien (iterName statt iterationId)
  const zeremonienRows = pis.flatMap(pi =>
    (pi.zeremonien ?? []).map(z => {
      const iter = z.iterationId ? pi.iterationen.find(it => it.id === z.iterationId) : null;
      return {
        piName: pi.name,
        type: z.type,
        title: z.title,
        date: z.date,
        startTime: z.startTime,
        durationMinutes: z.durationMinutes,
        location: z.location,
        description: z.description,
        iterName: iter?.name ?? '',
      };
    }),
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(zeremonienRows, { header: [...HEADERS_ZEREMONIEN] }),
    SHEET_ZEREMONIEN,
  );

  // Filename: pi_planung_YYYY-MM-DD.xlsx
  const today = new Date().toISOString().slice(0, 10);
  const filename = `pi_planung_${today}.xlsx`;

  // Trigger Download
  XLSX.writeFile(wb, filename);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ParsedPiXlsx {
  pis: PIPlanning[];
  warnings: string[];
}

/**
 * Liest ein Excel-Workbook und baut PIPlanning-Objekte. Iter-Namen-basiertes Mapping:
 *  - Iterationen aus Sheet 2 werden den PIs aus Sheet 1 zugeordnet (via piName).
 *  - Blocker referenzieren die Iteration via afterIterName (lookup nach Import).
 *  - Zeremonien referenzieren via iterName (optional).
 *
 * Validierungen:
 *  - PI-Name eindeutig im Sheet
 *  - Datumsformat YYYY-MM-DD
 *  - iterationWeeks 1-6 (wenn gesetzt)
 *  - Zeremonie-Typ aus erlaubter Liste
 *  - Querverweise: piName muss existieren, iterName muss innerhalb des PIs existieren
 */
export async function parsePiXlsx(file: File): Promise<ParsedPiXlsx> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const warnings: string[] = [];

  const piSheet = wb.Sheets[SHEET_PIS];
  if (!piSheet) throw new Error(`Sheet «${SHEET_PIS}» fehlt im Workbook.`);
  const piRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(piSheet, { defval: '' });

  const iterRows = wb.Sheets[SHEET_ITERATIONEN]
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[SHEET_ITERATIONEN], { defval: '' })
    : [];
  const blockerRows = wb.Sheets[SHEET_BLOCKER]
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[SHEET_BLOCKER], { defval: '' })
    : [];
  const zeremonienRows = wb.Sheets[SHEET_ZEREMONIEN]
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[SHEET_ZEREMONIEN], { defval: '' })
    : [];

  // case-insensitive lookup helper
  const lc = (row: Record<string, unknown>, key: string): string => {
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === key.toLowerCase()) return String(row[k] ?? '').trim();
    }
    return '';
  };
  const lcNum = (row: Record<string, unknown>, key: string): number | undefined => {
    const v = lc(row, key);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  // Schritt 1: PIs erstellen (mit neuen IDs)
  const pisByName = new Map<string, PIPlanning>();
  for (let i = 0; i < piRows.length; i++) {
    const row = piRows[i];
    const name = lc(row, 'name');
    const startStr = lc(row, 'startStr');
    const endStr = lc(row, 'endStr');
    const iterationWeeksRaw = lcNum(row, 'iterationWeeks');

    if (!name) continue; // leere Zeilen überspringen
    if (!startStr || !endStr) {
      throw new Error(`Sheet «${SHEET_PIS}» Zeile ${i + 2}: startStr und endStr sind erforderlich.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
      throw new Error(`Sheet «${SHEET_PIS}» Zeile ${i + 2}: Datumsformat muss YYYY-MM-DD sein.`);
    }
    if (startStr >= endStr) {
      throw new Error(`Sheet «${SHEET_PIS}» Zeile ${i + 2}: Startdatum muss vor Enddatum liegen.`);
    }
    if (iterationWeeksRaw !== undefined && (iterationWeeksRaw < 1 || iterationWeeksRaw > 6)) {
      throw new Error(`Sheet «${SHEET_PIS}» Zeile ${i + 2}: iterationWeeks muss zwischen 1 und 6 liegen.`);
    }
    if (pisByName.has(name)) {
      throw new Error(`Sheet «${SHEET_PIS}» Zeile ${i + 2}: PI-Name «${name}» kommt mehrfach vor.`);
    }

    pisByName.set(name, {
      id: crypto.randomUUID(),
      name,
      startStr,
      endStr,
      iterationen: [],
      ...(iterationWeeksRaw !== undefined ? { iterationWeeks: iterationWeeksRaw } : {}),
      blockerWeeks: [],
      zeremonien: [],
    });
  }

  // Schritt 2: Iterationen zuordnen (Iter-Name als Lookup-Key innerhalb des PIs)
  // Wir merken uns für jede PI eine name → Iteration-Map für spätere Blocker/Zeremonien-Auflösung
  const iterByPiAndName = new Map<string, Map<string, Iteration>>();
  for (let i = 0; i < iterRows.length; i++) {
    const row = iterRows[i];
    const piName = lc(row, 'piName');
    const iterName = lc(row, 'iterName');
    const startStr = lc(row, 'startStr');
    const endStr = lc(row, 'endStr');
    if (!piName) continue;
    const pi = pisByName.get(piName);
    if (!pi) {
      throw new Error(`Sheet «${SHEET_ITERATIONEN}» Zeile ${i + 2}: PI «${piName}» existiert nicht.`);
    }
    if (!iterName) {
      throw new Error(`Sheet «${SHEET_ITERATIONEN}» Zeile ${i + 2}: iterName ist erforderlich.`);
    }
    if (!startStr || !endStr) {
      throw new Error(`Sheet «${SHEET_ITERATIONEN}» Zeile ${i + 2}: startStr und endStr sind erforderlich.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr) || !/^\d{4}-\d{2}-\d{2}$/.test(endStr)) {
      throw new Error(`Sheet «${SHEET_ITERATIONEN}» Zeile ${i + 2}: Datumsformat muss YYYY-MM-DD sein.`);
    }
    const iteration: Iteration = {
      id: crypto.randomUUID(),
      name: iterName,
      startStr,
      endStr,
    };
    pi.iterationen.push(iteration);

    let map = iterByPiAndName.get(piName);
    if (!map) {
      map = new Map();
      iterByPiAndName.set(piName, map);
    }
    if (map.has(iterName)) {
      throw new Error(`Sheet «${SHEET_ITERATIONEN}» Zeile ${i + 2}: iterName «${iterName}» kommt mehrfach in PI «${piName}» vor.`);
    }
    map.set(iterName, iteration);
  }

  // Schritt 3: Blocker-Wochen (afterIterName → afterIterationId)
  for (let i = 0; i < blockerRows.length; i++) {
    const row = blockerRows[i];
    const piName = lc(row, 'piName');
    const afterIterName = lc(row, 'afterIterName');
    const label = lc(row, 'label');
    const weeksRaw = lcNum(row, 'weeks');
    if (!piName) continue;
    const pi = pisByName.get(piName);
    if (!pi) {
      throw new Error(`Sheet «${SHEET_BLOCKER}» Zeile ${i + 2}: PI «${piName}» existiert nicht.`);
    }
    if (!afterIterName) {
      throw new Error(`Sheet «${SHEET_BLOCKER}» Zeile ${i + 2}: afterIterName ist erforderlich.`);
    }
    if (!label) {
      throw new Error(`Sheet «${SHEET_BLOCKER}» Zeile ${i + 2}: label ist erforderlich.`);
    }
    if (weeksRaw === undefined || weeksRaw < 1 || weeksRaw > 12) {
      throw new Error(`Sheet «${SHEET_BLOCKER}» Zeile ${i + 2}: weeks muss zwischen 1 und 12 liegen.`);
    }
    const iter = iterByPiAndName.get(piName)?.get(afterIterName);
    if (!iter) {
      throw new Error(
        `Sheet «${SHEET_BLOCKER}» Zeile ${i + 2}: Iteration «${afterIterName}» existiert nicht in PI «${piName}».`,
      );
    }
    const blocker: PIBlockerWeek = {
      id: crypto.randomUUID(),
      label,
      afterIterationId: iter.id,
      weeks: weeksRaw,
    };
    (pi.blockerWeeks ??= []).push(blocker);
  }

  // Schritt 4: Zeremonien (iterName → iterationId, optional)
  for (let i = 0; i < zeremonienRows.length; i++) {
    const row = zeremonienRows[i];
    const piName = lc(row, 'piName');
    const typeRaw = lc(row, 'type').toUpperCase();
    const title = lc(row, 'title');
    const date = lc(row, 'date');
    const startTime = lc(row, 'startTime');
    const durationMinutesRaw = lcNum(row, 'durationMinutes');
    const location = lc(row, 'location');
    const description = lc(row, 'description');
    const iterName = lc(row, 'iterName');
    if (!piName) continue;
    const pi = pisByName.get(piName);
    if (!pi) {
      throw new Error(`Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: PI «${piName}» existiert nicht.`);
    }
    if (!ZEREMONIE_TYPES.includes(typeRaw as ZeremonieType)) {
      throw new Error(
        `Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: type «${typeRaw}» ist ungültig. Erlaubt: ${ZEREMONIE_TYPES.join(', ')}.`,
      );
    }
    if (!title) {
      throw new Error(`Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: title ist erforderlich.`);
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: date muss YYYY-MM-DD sein.`);
    }
    if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime)) {
      throw new Error(`Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: startTime muss HH:MM sein.`);
    }
    if (durationMinutesRaw === undefined || durationMinutesRaw < 1 || durationMinutesRaw > 60 * 48) {
      throw new Error(
        `Sheet «${SHEET_ZEREMONIEN}» Zeile ${i + 2}: durationMinutes muss zwischen 1 und ${60 * 48} liegen.`,
      );
    }
    if (date < pi.startStr || date > pi.endStr) {
      warnings.push(
        `Zeremonie «${title}» (${date}) liegt ausserhalb des PI-Zeitraums von «${piName}» (${pi.startStr} – ${pi.endStr}).`,
      );
    }

    let iterationId: string | undefined;
    if (iterName) {
      const iter = iterByPiAndName.get(piName)?.get(iterName);
      if (!iter) {
        warnings.push(
          `Zeremonie «${title}»: iterName «${iterName}» existiert nicht in PI «${piName}» — Zuordnung ignoriert.`,
        );
      } else {
        iterationId = iter.id;
      }
    }

    // Startzeit auf HH:mm normalisieren (z.B. "9:00" → "09:00")
    const [h, m] = startTime.split(':');
    const normalizedTime = `${h.padStart(2, '0')}:${m}`;

    const zeremonie: PIZeremonie = {
      id: crypto.randomUUID(),
      type: typeRaw as ZeremonieType,
      title,
      date,
      startTime: normalizedTime,
      durationMinutes: durationMinutesRaw,
      location,
      description,
      iterationId,
    };
    (pi.zeremonien ??= []).push(zeremonie);
  }

  return { pis: Array.from(pisByName.values()), warnings };
}

/**
 * Wendet importierte PIs auf bestehende Liste an.
 * mode='append': neue PIs hinzufügen; bei Namens-Konflikt Fehler werfen
 * mode='replace': bestehende PIs gleichen Namens werden überschrieben (alte ID wird ersetzt)
 */
export function mergeImportedPis(
  existing: PIPlanning[],
  imported: PIPlanning[],
  mode: 'append' | 'replace',
): PIPlanning[] {
  if (mode === 'append') {
    const existingNames = new Set(existing.map(p => p.name.trim().toLowerCase()));
    const conflicts = imported.filter(p => existingNames.has(p.name.trim().toLowerCase()));
    if (conflicts.length > 0) {
      throw new Error(
        `Anhängen abgebrochen — folgende PI-Namen existieren bereits: ${conflicts.map(p => p.name).join(', ')}. ` +
        `Wähle «Überschreiben» oder benenne die PIs in der Excel-Datei um.`,
      );
    }
    return [...existing, ...imported];
  } else {
    const importedNames = new Set(imported.map(p => p.name.trim().toLowerCase()));
    const kept = existing.filter(p => !importedNames.has(p.name.trim().toLowerCase()));
    return [...kept, ...imported];
  }
}
