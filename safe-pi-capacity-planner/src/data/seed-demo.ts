// Demo-Daten für Demo-Train: greifen wenn Server-State komplett leer ist.
// In App.tsx in `applyServerState()` als Fallback gesetzt für `tenantId === 'default'`.
//
// Inhalt: ein vollständiges PI mit Iterationen + Blocker + Zeremonien (inkl. Serie),
// damit der RTE die F29-Funktionen sofort sieht.

import type { PIPlanning, Feiertag } from '../types';

const I1_ID = 'demo-iter-1';
const I2_ID = 'demo-iter-2';
const I3_ID = 'demo-iter-3';
const I4_ID = 'demo-iter-4';
const I5_ID = 'demo-iter-5';

export const DEMO_PIS: PIPlanning[] = [
  {
    id: 'demo-pi-26-2',
    name: 'PI26-2',
    startStr: '2026-04-27',
    endStr: '2026-08-23',
    iterationWeeks: 3,
    iterationen: [
      { id: I1_ID, name: 'I1', startStr: '2026-04-27', endStr: '2026-05-17' },
      { id: I2_ID, name: 'I2', startStr: '2026-05-25', endStr: '2026-06-14' },
      { id: I3_ID, name: 'I3', startStr: '2026-06-15', endStr: '2026-07-05' },
      { id: I4_ID, name: 'I4', startStr: '2026-07-06', endStr: '2026-07-26' },
      { id: I5_ID, name: 'I5', startStr: '2026-08-03', endStr: '2026-08-23' },
    ],
    blockerWeeks: [
      { id: 'demo-blk-1', label: 'Pfingsten', afterIterationId: I1_ID, weeks: 1 },
      { id: 'demo-blk-2', label: 'Sommerpause', afterIterationId: I4_ID, weeks: 1 },
    ],
    zeremonien: [
      // Mehrtägiger PI-Planning-Termin
      {
        id: 'demo-zer-1',
        type: 'PI_PLANNING',
        title: 'PI Planning',
        date: '2026-04-27',
        startTime: '09:00',
        durationMinutes: 1920, // 2 Tage à 16h
        startDate: '2026-04-27',
        endDate: '2026-04-28',
        endTime: '17:00',
        location: 'Bern, BIT-Saal',
        description: 'Zwei-Tages-Planung mit allen Teams.',
        iterationId: I1_ID,
      },
      // Wöchentliche System-Demo-Serie
      {
        id: 'demo-zer-2',
        type: 'SYSTEM_DEMO',
        title: 'System Demo',
        date: '2026-05-15',
        startTime: '14:00',
        durationMinutes: 120,
        startDate: '2026-05-15',
        endDate: '2026-05-15',
        endTime: '16:00',
        recurrence: { frequency: 'WEEKLY', interval: 1, count: 5 },
        location: 'MS Teams',
        description: 'Wöchentliche Demo der fertigen Stories.',
        iterationId: undefined,
      },
      // Inspect & Adapt am Ende des PI
      {
        id: 'demo-zer-3',
        type: 'INSPECT_ADAPT',
        title: 'Inspect & Adapt',
        date: '2026-08-21',
        startTime: '09:00',
        durationMinutes: 240,
        startDate: '2026-08-21',
        endDate: '2026-08-21',
        endTime: '13:00',
        location: 'Bern',
        description: 'Retrospektive + Verbesserungsmassnahmen.',
        iterationId: I5_ID,
      },
    ],
  },
];

/** Schweizer Feiertage 2026 (kleine Auswahl als Demo) */
export const DEMO_FEIERTAGE: Feiertag[] = [
  { id: 'demo-fer-1', name: 'Karfreitag', startStr: '2026-04-03', endStr: '2026-04-03' },
  { id: 'demo-fer-2', name: 'Ostermontag', startStr: '2026-04-06', endStr: '2026-04-06' },
  { id: 'demo-fer-3', name: 'Auffahrt', startStr: '2026-05-14', endStr: '2026-05-14' },
  { id: 'demo-fer-4', name: 'Pfingstmontag', startStr: '2026-05-25', endStr: '2026-05-25' },
  { id: 'demo-fer-5', name: 'Bundesfeier', startStr: '2026-08-01', endStr: '2026-08-01' },
];
