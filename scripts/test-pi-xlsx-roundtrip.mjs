// Round-Trip-Test für pi-xlsx Export/Import — node ESM
// Erzeugt ein PI mit allen F29-Feldern, exportiert nach .xlsx, liest zurück, vergleicht.

import * as XLSX from 'xlsx';

// Mock PI mit voller F29-Struktur
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
    {
      id: 'zer-1', type: 'SYSTEM_DEMO', title: 'System Demo I1',
      date: '2026-05-14', startTime: '14:00', durationMinutes: 120,
      location: 'Bern, Raum 4.12', description: 'Multi-line\nBeschreibung', iterationId: 'iter-1',
    },
    {
      id: 'zer-2', type: 'PI_PLANNING', title: 'PI Planning',
      date: '2026-04-27', startTime: '09:00', durationMinutes: 960,
      location: '', description: '', iterationId: undefined,
    },
  ],
};

// ─── Export simulieren (gleicher Code wie pi-xlsx.ts) ────────────────────────
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
  piName: samplePi.name, type: z.type, title: z.title, date: z.date, startTime: z.startTime,
  durationMinutes: z.durationMinutes, location: z.location, description: z.description,
  iterName: z.iterationId ? samplePi.iterationen.find(it => it.id === z.iterationId)?.name ?? '' : '',
}))), 'Zeremonien');

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
console.log(`Export OK: ${buf.length} bytes, ${wb.SheetNames.length} sheets (${wb.SheetNames.join(', ')})`);

// ─── Import simulieren ───────────────────────────────────────────────────────
const wb2 = XLSX.read(buf, { type: 'buffer' });
const piRows = XLSX.utils.sheet_to_json(wb2.Sheets['PIs'], { defval: '' });
const iterRows = XLSX.utils.sheet_to_json(wb2.Sheets['Iterationen'], { defval: '' });
const blockerRows = XLSX.utils.sheet_to_json(wb2.Sheets['Blocker-Wochen'], { defval: '' });
const zeremonienRows = XLSX.utils.sheet_to_json(wb2.Sheets['Zeremonien'], { defval: '' });

console.log(`\nImport OK:`);
console.log(`  PIs: ${piRows.length} -> name=${piRows[0].name}, iterationWeeks=${piRows[0].iterationWeeks}`);
console.log(`  Iterationen: ${iterRows.length}`);
iterRows.forEach(r => console.log(`    ${r.iterName}: ${r.startStr} -> ${r.endStr}`));
console.log(`  Blocker: ${blockerRows.length}`);
blockerRows.forEach(b => console.log(`    ${b.label} nach ${b.afterIterName} (${b.weeks} Wo.)`));
console.log(`  Zeremonien: ${zeremonienRows.length}`);
zeremonienRows.forEach(z => console.log(`    ${z.type}: ${z.title} am ${z.date} ${z.startTime} (${z.durationMinutes} Min) iterName=${z.iterName || '(keine)'}`));

// ─── Validierung Round-Trip ──────────────────────────────────────────────────
const ok =
  piRows.length === 1 &&
  iterRows.length === samplePi.iterationen.length &&
  blockerRows.length === samplePi.blockerWeeks.length &&
  zeremonienRows.length === samplePi.zeremonien.length &&
  piRows[0].iterationWeeks === samplePi.iterationWeeks &&
  blockerRows[0].afterIterName === 'I1' &&
  zeremonienRows[0].iterName === 'I1' &&
  zeremonienRows[1].iterName === '';

console.log(`\n=== ROUND-TRIP ${ok ? 'PASSED ✓' : 'FAILED ✗'} ===`);
process.exit(ok ? 0 : 1);
