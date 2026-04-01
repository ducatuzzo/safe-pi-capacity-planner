// Server-seitiger State-Manager: hält SavedProjectState in-memory als Single Source of Truth

import type { SavedProjectState, Employee, AllocationType, AppData } from '../src/types';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER } from '../src/data/seed';

const INITIAL_TEAM_ZIELWERTE: AppData['teamZielwerte'] = [
  { team: 'NET', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'ACM', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'CON', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
  { team: 'PAF', minPersonenPikett: 2, minPersonenBetrieb: 2, storyPointsPerDay: 1, standardstundenProJahr: 1600 },
];

function buildInitialState(): SavedProjectState {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    year: new Date().getFullYear(),
    employees: SEED_EMPLOYEES,
    appData: {
      feiertage: SEED_FEIERTAGE,
      schulferien: SEED_SCHULFERIEN,
      pis: SEED_PIS,
      blocker: SEED_BLOCKER,
      teamZielwerte: INITIAL_TEAM_ZIELWERTE,
    },
  };
}

let currentState: SavedProjectState = buildInitialState();

export function getState(): SavedProjectState {
  return currentState;
}

export function setState(s: SavedProjectState): void {
  currentState = s;
}

export function applyAllocationChange(
  employeeId: string,
  dateStr: string,
  type: AllocationType,
): void {
  currentState = {
    ...currentState,
    employees: currentState.employees.map(emp => {
      if (emp.id !== employeeId) return emp;
      const newAllocations = { ...emp.allocations };
      if (type === 'NONE') {
        delete newAllocations[dateStr];
      } else {
        newAllocations[dateStr] = type;
      }
      return { ...emp, allocations: newAllocations };
    }),
  };
}

export function applySettingsChange(changeType: string, data: unknown): void {
  if (changeType === 'employees') {
    currentState = { ...currentState, employees: data as Employee[] };
    return;
  }
  const appData = { ...currentState.appData };
  switch (changeType) {
    case 'pis':
      appData.pis = data as AppData['pis'];
      break;
    case 'feiertage':
      appData.feiertage = data as AppData['feiertage'];
      break;
    case 'schulferien':
      appData.schulferien = data as AppData['schulferien'];
      break;
    case 'blocker':
      appData.blocker = data as AppData['blocker'];
      break;
    case 'teamZielwerte':
      appData.teamZielwerte = data as AppData['teamZielwerte'];
      break;
  }
  currentState = { ...currentState, appData };
}
