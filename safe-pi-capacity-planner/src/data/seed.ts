// Initialdaten aus CSV-Importen (Mitarbeiterstamm, PI-Planung, Feiertage, Schulferien, Blocker)
// Quelle: C:\Users\Davide\Documents\AI\*.csv

import type { Employee, PIPlanning, Feiertag, Schulferien, Blocker } from '../types';

export const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-01', vorname: 'Davide',       name: 'Muscarà',            team: 'NET', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 0,  pauschalPercent: 0,  storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-02', vorname: 'Eric',          name: 'Bazzana Camarena',   team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 50, pauschalPercent: 10, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-03', vorname: 'Jonathan',      name: 'Cattaneo',           team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 0,  pauschalPercent: 0,  storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-04', vorname: 'Ralph',         name: 'Grossenbacher',      team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 50, pauschalPercent: 10, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-05', vorname: 'Alain',         name: 'Kramer',             team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 50, pauschalPercent: 10, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-06', vorname: 'Rudolf',        name: 'Rothenbühler',       team: 'ACM', type: 'iMA', fte: 0.8, capacityPercent: 80,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-07', vorname: 'Beat',          name: 'Schneider',          team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-08', vorname: 'Michel-Simon',  name: 'Thomas',             team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-09', vorname: 'Iman',          name: 'Babaei',             team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-10', vorname: 'Christian',     name: 'Lauber',             team: 'ACM', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-11', vorname: 'Bojan',         name: 'Jambresic',          team: 'CON', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-12', vorname: 'Domninik',      name: 'Krebs',              team: 'CON', type: 'iMA', fte: 0.6, capacityPercent: 60,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-13', vorname: 'Jan',           name: 'Müller',             team: 'CON', type: 'iMA', fte: 0.6, capacityPercent: 60,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-14', vorname: 'Samuel',        name: 'Weber',              team: 'CON', type: 'iMA', fte: 0.6, capacityPercent: 60,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-15', vorname: 'André',         name: 'Tellenbach',         team: 'CON', type: 'iMA', fte: 0.9, capacityPercent: 90,  betriebPercent: 0,  pauschalPercent: 0,  storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-16', vorname: 'Kerim',         name: 'Akbas',              team: 'CON', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-17', vorname: 'Theodolf',      name: 'Reber',              team: 'CON', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-18', vorname: 'Andreas',       name: 'Dänzer',             team: 'PAF', type: 'iMA', fte: 0.9, capacityPercent: 90,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-19', vorname: 'Patrick',       name: 'Egger',              team: 'PAF', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-20', vorname: 'Amila',         name: 'Egli',               team: 'PAF', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-21', vorname: 'Jonas',         name: 'Furrer',             team: 'PAF', type: 'iMA', fte: 0.5, capacityPercent: 50,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-22', vorname: 'Michael',       name: 'Reilly',             team: 'PAF', type: 'iMA', fte: 0.9, capacityPercent: 90,  betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-23', vorname: 'Miriam',        name: 'Meli',               team: 'PAF', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-24', vorname: 'Vincent',       name: 'Rossier',            team: 'PAF', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
  { id: 'emp-25', vorname: 'Naveen',        name: 'Navaratnam',         team: 'PAF', type: 'iMA', fte: 1.0, capacityPercent: 100, betriebPercent: 10, pauschalPercent: 50, storyPointsPerDay: 1, allocations: {} },
];

export const SEED_PIS: PIPlanning[] = [
  { id: 'pi-25-4', name: 'PI25-4', startStr: '2025-12-29', endStr: '2026-03-11', iterationen: [] },
  { id: 'pi-26-1', name: 'PI26-1', startStr: '2026-03-12', endStr: '2026-06-03', iterationen: [] },
  { id: 'pi-26-2', name: 'PI26-2', startStr: '2026-06-04', endStr: '2026-08-26', iterationen: [] },
  { id: 'pi-26-3', name: 'PI26-3', startStr: '2026-08-27', endStr: '2026-11-18', iterationen: [] },
  { id: 'pi-26-4', name: 'PI26-4', startStr: '2026-11-19', endStr: '2027-02-10', iterationen: [] },
];

export const SEED_FEIERTAGE: Feiertag[] = [
  { id: 'fei-01', name: 'Neujahr',          startStr: '2025-01-01', endStr: '2025-01-01' },
  { id: 'fei-02', name: 'Berchtoldstag',    startStr: '2025-01-02', endStr: '2025-01-02' },
  { id: 'fei-03', name: 'Karfreitag',       startStr: '2025-04-18', endStr: '2025-04-18' },
  { id: 'fei-04', name: 'Ostermontag',      startStr: '2025-04-21', endStr: '2025-04-21' },
  { id: 'fei-05', name: 'Auffahrt',         startStr: '2025-05-29', endStr: '2025-05-29' },
  { id: 'fei-06', name: 'Pfingstmontag',    startStr: '2025-06-09', endStr: '2025-06-09' },
  { id: 'fei-07', name: 'Nationalfeiertag', startStr: '2025-08-01', endStr: '2025-08-01' },
  { id: 'fei-08', name: 'Weihnachten',      startStr: '2025-12-24', endStr: '2025-12-26' },
  { id: 'fei-09', name: 'Silvester',        startStr: '2025-12-31', endStr: '2025-12-31' },
  { id: 'fei-10', name: 'Neujahr',          startStr: '2026-01-01', endStr: '2026-01-02' },
  { id: 'fei-11', name: 'Karfreitag',       startStr: '2026-04-03', endStr: '2026-04-03' },
  { id: 'fei-12', name: 'Ostermontag',      startStr: '2026-04-06', endStr: '2026-04-06' },
  { id: 'fei-13', name: 'Auffahrt',         startStr: '2026-05-14', endStr: '2026-05-14' },
  { id: 'fei-14', name: 'Pfingstmontag',    startStr: '2026-05-25', endStr: '2026-05-25' },
];

export const SEED_BLOCKER: Blocker[] = [
  { id: 'blk-01', name: 'End of Year Freeze', startStr: '2025-12-24', endStr: '2026-01-02' },
];

export const SEED_SCHULFERIEN: Schulferien[] = [
  { id: 'sf-01', name: 'Weihnachtsferien', startStr: '2025-01-01', endStr: '2025-01-05' },
  { id: 'sf-02', name: 'Sportferien',      startStr: '2025-02-01', endStr: '2025-02-09' },
  { id: 'sf-03', name: 'Frühlingsferien',  startStr: '2025-04-05', endStr: '2025-04-20' },
  { id: 'sf-04', name: 'Sommerferien',     startStr: '2025-07-05', endStr: '2025-08-10' },
  { id: 'sf-05', name: 'Herbstferien',     startStr: '2025-09-20', endStr: '2025-10-12' },
  { id: 'sf-06', name: 'Weihnachtsferien', startStr: '2025-12-20', endStr: '2026-01-04' },
  { id: 'sf-07', name: 'Sportferien',      startStr: '2026-01-31', endStr: '2026-02-08' },
  { id: 'sf-08', name: 'Frühlingsferien',  startStr: '2026-04-03', endStr: '2026-04-19' },
  { id: 'sf-09', name: 'Sommerferien',     startStr: '2026-07-04', endStr: '2026-08-09' },
];
