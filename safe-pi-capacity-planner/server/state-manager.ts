// Server-seitiger State-Manager: hält SavedProjectState in-memory als Single Source of Truth
// JSON-File-Persistenz: liest state.json beim Start, schreibt nach jeder Mutation

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SavedProjectState, Employee, AllocationType, AppData } from '../src/types';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER } from '../src/data/seed';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');

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

function loadPersistedState(): SavedProjectState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const raw = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as SavedProjectState;
  } catch (err) {
    console.warn('[StateManager] state.json konnte nicht geladen werden:', err);
    return null;
  }
}

function persistState(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[StateManager] Persistierung fehlgeschlagen:', err);
  }
}

const loaded = loadPersistedState();
if (loaded) {
  console.log('[StateManager] State aus state.json geladen.');
} else {
  console.log('[StateManager] Kein gespeicherter State gefunden – SEED-Daten werden verwendet.');
}
let currentState: SavedProjectState = loaded ?? buildInitialState();

// Beim ersten Start ohne state.json: SEED-State sofort persistieren
if (!loaded) {
  persistState();
}

export function getState(): SavedProjectState {
  return currentState;
}

export function setState(s: SavedProjectState): void {
  currentState = s;
  persistState();
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
  persistState();
}

export function applySettingsChange(changeType: string, data: unknown): void {
  if (changeType === 'employees') {
    currentState = { ...currentState, employees: data as Employee[] };
    persistState();
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
  persistState();
}
