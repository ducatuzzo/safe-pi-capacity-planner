// Round-Trip-Test für pi-xlsx Export/Import — node ESM
// Schema 1.6 (Etappe 5): Test mit Start/Ende-Felder + Recurrence + mehrtägigen Terminen

import * as XLSX from 'xlsx';

// Mock PI mit voller F29 v2 (Schema 1.6) Struktur
const i1 = { id: 'iter-1', name: 'I1', startStr: '2026-04-27', endStr: '2026-05-17' };
const i2 = { id: 'iter-2', name: 'I2', startStr: '2026-05-25', endStr: '2026-06-14' };
const samplePi = {
  id: 'pi-1',
  name: 'PI26-2',
  startStr: '2026-04-27',
  endStr: '2026-08-16',
  iterationen: [i1, i2],
  iterationWeeks: 3,
  blockerWeeks: [
    { id: 'blk-1', label: 'Weihnachten', afterIterationId: 'iter-1', weeks: 1 },
  ],
  zeremonien: [
    // 1: Einzeltermin, gleicher Tag
    {
      id: 'zer-1', type: 'SYSTEM_DEMO', title: 'System Demo I1',
      date: '2026-05-14', startTime: '14:00', durationMinutes: 120,
      startDate: '2026-05-14', endDate: '2026-05-14', endTime: '16:00',
      location: 'Bern, Raum 4.12', description: 'Multi-line\nBeschreibung', iterationId: 'iter-1',
    },
    // 2: Wöchentliche Serie, COUNT=5
    {
      id: 'zer-2', type: 'SYSTEM_DEMO', title: 'System Demo Serie',
      date: '2026-05-14', startTime: '14:00', durationMinutes: 120,
      startDate: '2026-05-14', endDate: '2026-05-14', endTime: '16:00',
      recurrence: { frequency: 'WEEKLY', interval: 1, count: 5 },
      location: '', description: '', iterationId: 'iter-1',
    },
    // 3: Tägliche Serie mit UNTIL
    {
      id: 'zer-3', type: 'PI_PLANNING', title: 'Daily Standup',
      date: '2026-05-04', startTime: '09:00', durationMinutes: 15,
      startDate: '2026-05-04', endDate: '2026-05-04', endTime: '09:15',
      recurrence: { frequency: 'DAILY', interval: 1, until: '2026-05-15' },
      location: 'MS Teams', description: '', iterationId: undefined,
    },
    // 4: Mehrtägiger Termin (PI Planning, 2 Tage)
    {
      id: 'zer-4', type: 'PI_PLANNING', title: 'PI Planning',
      date: '2026-04-27', startTime: '09:00', durationMinutes: 480 + 60 * 24, // 2 Tage à 8h spread
      startDate: '2026-04-27', endDate: '2026-04-28', endTime: '17:00',
      location: 'Bern', description: '', iterationId: undefined,
    },
  ],
};

// ─── Export simulieren (gleicher Code wie pi-xlsx.ts Schema 1.6) ─────────────
const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
  name: samplePi.name, startStr: samplePi.startStr, endStr: samplePi.endStr, iterationWeeks: samplePi.iterationWeeks,
}]), 'PIs');

XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(samplePi.iterationen.map(it => ({
  piName: samplePi.name, iterName: it.name, startStr: it.startStr, endStr: it.endStr,
}))), 'Iterationen');

XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(samplePi.blockerWeeks.map(b => ({
  piName: samplePi.name,
  afterIterName: samplePi.iterationen.find(it => it.id === b.afterIterationId)?.name ?? '',
  label: b.label, weeks: b.weeks,
}))), 'Blocker-Wochen');

XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(samplePi.zeremonien.map(z => ({
  piName: samplePi.name, type: z.type, title: z.title,
  startDate: z.startDate, startTime: z.startTime, endDate: z.endDate, endTime: z.endTime,
  recurrenceFreq: z.recurrence?.frequency ?? '',
  recurrenceInterval: z.recurrence?.interval ?? '',
  recurrenceCount: z.recurrence?.count ?? '',
  recurrenceUntil: z.recurrence?.until ?? '',
  location: z.location, description: z.description,
  iterName: z.iterationId ? samplePi.iterationen.find(it => it.id === z.iterationId)?.name ?? '' : '',
}))), 'Zeremonien');

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
console.log(`Export OK: ${buf.length} bytes, ${wb.SheetNames.length} sheets`);

// ─── Import simulieren ───────────────────────────────────────────────────────
const wb2 = XLSX.read(buf, { type: 'buffer' });
const piRows = XLSX.utils.sheet_to_json(wb2.Sheets['PIs'], { defval: '' });
const iterRows = XLSX.utils.sheet_to_json(wb2.Sheets['Iterationen'], { defval: '' });
const blockerRows = XLSX.utils.sheet_to_json(wb2.Sheets['Blocker-Wochen'], { defval: '' });
const zRows = XLSX.utils.sheet_to_json(wb2.Sheets['Zeremonien'], { defval: '' });

console.log(`\nImport OK:`);
console.log(`  PIs: ${piRows.length}`);
console.log(`  Iterationen: ${iterRows.length}`);
console.log(`  Blocker: ${blockerRows.length}`);
console.log(`  Zeremonien: ${zRows.length}`);
console.log('\n--- Zeremonien-Detail ---');
zRows.forEach((z, idx) => {
  const range = `${z.startDate} ${z.startTime} → ${z.endDate} ${z.endTime}`;
  const serie = z.recurrenceFreq
    ? ` [${z.recurrenceFreq} interval=${z.recurrenceInterval} ${z.recurrenceCount ? `count=${z.recurrenceCount}` : `until=${z.recurrenceUntil}`}]`
    : '';
  console.log(`  ${idx + 1}. ${z.type}: ${z.title}`);
  console.log(`     ${range}${serie}`);
  console.log(`     iter=${z.iterName || '(keine)'}`);
});

// ─── Validierung Round-Trip Schema 1.6 ───────────────────────────────────────
const ok =
  zRows.length === 4 &&
  // 1. Einzeltermin
  zRows[0].startDate === '2026-05-14' && zRows[0].endDate === '2026-05-14' &&
  zRows[0].endTime === '16:00' && !zRows[0].recurrenceFreq &&
  // 2. WEEKLY × 5
  zRows[1].recurrenceFreq === 'WEEKLY' && zRows[1].recurrenceCount === 5 &&
  // 3. DAILY UNTIL
  zRows[2].recurrenceFreq === 'DAILY' && zRows[2].recurrenceUntil === '2026-05-15' &&
  // 4. Mehrtägig
  zRows[3].startDate === '2026-04-27' && zRows[3].endDate === '2026-04-28' &&
  zRows[3].endTime === '17:00';

console.log(`\n=== ROUND-TRIP ${ok ? 'PASSED ✓' : 'FAILED ✗'} ===`);
process.exit(ok ? 0 : 1);
