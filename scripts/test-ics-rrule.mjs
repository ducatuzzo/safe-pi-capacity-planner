// Etappe 2: Test der ICS-Generierung mit Schema 1.6 (Start/Ende-Datum + RRULE)
// Tests:
//   1. Einzeltermin (kein recurrence)
//   2. Wöchentliche Serie mit COUNT=5
//   3. Tägliche Serie mit UNTIL
//   4. Monatliche Serie mit INTERVAL=2

// Wir simulieren generateIcs lokal (ohne TypeScript), spiegelt 1:1 die Logik aus ics-export.ts
function formatLocalDateTime(d, t) { return `${d.replace(/-/g, '')}T${t.replace(/:/g, '')}00`; }
function escapeText(v) { return v.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function buildRrule(r) {
  const parts = [`FREQ=${r.frequency}`];
  if (r.interval && r.interval > 1) parts.push(`INTERVAL=${r.interval}`);
  if (r.count !== undefined) parts.push(`COUNT=${r.count}`);
  else if (r.until) parts.push(`UNTIL=${r.until.replace(/-/g, '')}T235959`);
  return parts.join(';');
}
function generateIcs(pi, z) {
  const dtstart = formatLocalDateTime(z.startDate, z.startTime);
  const dtend = formatLocalDateTime(z.endDate, z.endTime);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//BIT SAFe PI Capacity Planner//DE',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${z.id}@safe-pi-capacity-planner.vercel.app`,
    `DTSTAMP:20260507T120000Z`,
    `DTSTART:${dtstart}`, `DTEND:${dtend}`,
    `SUMMARY:${escapeText(`${z.title} (${pi.name})`)}`,
  ];
  if (z.recurrence) lines.push(`RRULE:${buildRrule(z.recurrence)}`);
  if (z.description) lines.push(`DESCRIPTION:${escapeText(z.description)}`);
  if (z.location) lines.push(`LOCATION:${escapeText(z.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

const pi = { name: 'PI26-2' };

// ─── Test 1: Einzeltermin ──────────────────────────────────────────────────
const t1 = generateIcs(pi, {
  id: 'z1', type: 'SYSTEM_DEMO', title: 'System Demo',
  startDate: '2026-05-14', startTime: '14:00', endDate: '2026-05-14', endTime: '16:00',
  location: 'Bern', description: 'Quartalsweiser Demo-Termin',
});
console.log('=== Test 1: Einzeltermin ===');
console.log(t1);
const test1ok = t1.includes('DTSTART:20260514T140000') && t1.includes('DTEND:20260514T160000') && !t1.includes('RRULE');

// ─── Test 2: Wöchentliche Serie, COUNT=5 ───────────────────────────────────
const t2 = generateIcs(pi, {
  id: 'z2', type: 'SYSTEM_DEMO', title: 'System Demo',
  startDate: '2026-05-14', startTime: '14:00', endDate: '2026-05-14', endTime: '16:00',
  location: '', description: '',
  recurrence: { frequency: 'WEEKLY', interval: 1, count: 5 },
});
console.log('\n=== Test 2: Wöchentliche Serie, 5× ===');
console.log(t2);
const test2ok = t2.includes('RRULE:FREQ=WEEKLY;COUNT=5') && !t2.includes('INTERVAL'); // INTERVAL=1 weggelassen

// ─── Test 3: Tägliche Serie mit UNTIL ──────────────────────────────────────
const t3 = generateIcs(pi, {
  id: 'z3', type: 'PI_PLANNING', title: 'Daily Standup',
  startDate: '2026-05-14', startTime: '09:00', endDate: '2026-05-14', endTime: '09:15',
  location: '', description: '',
  recurrence: { frequency: 'DAILY', interval: 1, until: '2026-06-30' },
});
console.log('\n=== Test 3: Tägliche Serie bis Ende-Datum ===');
console.log(t3);
const test3ok = t3.includes('RRULE:FREQ=DAILY;UNTIL=20260630T235959');

// ─── Test 4: Monatliche Serie, INTERVAL=2 ──────────────────────────────────
const t4 = generateIcs(pi, {
  id: 'z4', type: 'INSPECT_ADAPT', title: 'Inspect & Adapt',
  startDate: '2026-08-14', startTime: '09:00', endDate: '2026-08-14', endTime: '13:00',
  location: '', description: '',
  recurrence: { frequency: 'MONTHLY', interval: 2, count: 6 },
});
console.log('\n=== Test 4: Monatliche Serie, alle 2 Monate, 6× ===');
console.log(t4);
const test4ok = t4.includes('RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=6');

// ─── Test 5: Mehrtägiger Einzeltermin (PI Planning 2 Tage) ─────────────────
const t5 = generateIcs(pi, {
  id: 'z5', type: 'PI_PLANNING', title: 'PI Planning',
  startDate: '2026-04-27', startTime: '09:00', endDate: '2026-04-28', endTime: '17:00',
  location: 'Bern', description: '',
});
console.log('\n=== Test 5: Mehrtägiger Termin (Tag 1 09:00 → Tag 2 17:00) ===');
console.log(t5);
const test5ok = t5.includes('DTSTART:20260427T090000') && t5.includes('DTEND:20260428T170000');

console.log('\n=== RESULTS ===');
console.log(`Test 1 (Einzeltermin):           ${test1ok ? '✓' : '✗'}`);
console.log(`Test 2 (WEEKLY COUNT=5):         ${test2ok ? '✓' : '✗'}`);
console.log(`Test 3 (DAILY UNTIL):            ${test3ok ? '✓' : '✗'}`);
console.log(`Test 4 (MONTHLY INTERVAL=2):     ${test4ok ? '✓' : '✗'}`);
console.log(`Test 5 (Mehrtägig):              ${test5ok ? '✓' : '✗'}`);

const all = test1ok && test2ok && test3ok && test4ok && test5ok;
console.log(`\n${all ? 'ALL PASSED ✓' : 'FAILURES ✗'}`);
process.exit(all ? 0 : 1);
