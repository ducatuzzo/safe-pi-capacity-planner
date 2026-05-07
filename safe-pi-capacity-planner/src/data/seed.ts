// Seed-Daten: leer bei Initial-Mount der App.
// Demo-Daten für den Demo-Train werden separat in seed-demo.ts gehalten
// und greifen via App.tsx wenn Server-State leer ist (siehe applyServerState).

import type { Employee, PIPlanning, Feiertag, Schulferien, Blocker, GlobalCapacityConfig, TeamConfig } from '../types';

export const SEED_EMPLOYEES: Employee[] = [];
export const SEED_PIS: PIPlanning[] = [];
export const SEED_FEIERTAGE: Feiertag[] = [];
export const SEED_SCHULFERIEN: Schulferien[] = [];
export const SEED_BLOCKER: Blocker[] = [];

export const SEED_GLOBAL_CONFIG: GlobalCapacityConfig = {
  spPerDay: 1,
  hoursPerYear: 1600,
};

export const SEED_TEAM_CONFIGS: TeamConfig[] = [
  { teamName: 'PAF', minPikett: 1, minBetrieb: 2, storyPointsPerDay: 1, hoursPerYear: 1600 },
  { teamName: 'ACM', minPikett: 1, minBetrieb: 2, storyPointsPerDay: 1, hoursPerYear: 1600 },
  { teamName: 'NET', minPikett: 0, minBetrieb: 1, storyPointsPerDay: 1, hoursPerYear: 1600 },
  { teamName: 'CON', minPikett: 0, minBetrieb: 1, storyPointsPerDay: 1, hoursPerYear: 1600 },
];
