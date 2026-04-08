// Server-seitiger State-Manager: hält SavedProjectState in-memory als Single Source of Truth
// JSON-File-Persistenz: liest state.json beim Start, schreibt nach jeder Mutation

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SavedProjectState, Employee, AllocationType, AppData } from '../src/types';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER } from '../src/data/seed';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_RAILWAY = !!process.env.RAILWAY_ENVIRONMENT;
const DATA_DIR = IS_RAILWAY
  ? '/app/data'
  : join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');
console.log(`[StateManager] DATA_DIR: ${DATA_DIR} (Railway: ${IS_RAILWAY})`);

const INITIAL_GLOBAL_CONFIG: AppData['globalConfig'] = {
  spPerDay: 1,
  hoursPerYear: 1600,
};

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
      teamZielwerte: [],
      globalConfig: INITIAL_GLOBAL_CONFIG,
      teamConfigs: [],
      piTeamTargets: [],
    },
  };
}

function loadPersistedState(): SavedProjectState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const raw = readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as SavedProjectState;

    // Fehlende Felder mit Defaults auffüllen (Migrationsschutz)
    parsed.appData.globalConfig ??= INITIAL_GLOBAL_CONFIG;
    parsed.appData.teamConfigs ??= [];
    parsed.appData.piTeamTargets ??= [];
    parsed.appData.teamZielwerte ??= [];

    // Migration: alte teamZielwerte → teamConfigs (einmalig)
    if (parsed.appData.teamConfigs.length === 0 && parsed.appData.teamZielwerte.length > 0) {
      console.log('[StateManager] Migriere teamZielwerte → teamConfigs');
      parsed.appData.teamConfigs = parsed.appData.teamZielwerte.map(z => ({
        teamName: z.team,
        minPikett: z.minPersonenPikett,
        minBetrieb: z.minPersonenBetrieb,
        storyPointsPerDay: z.storyPointsPerDay,
        hoursPerYear: z.standardstundenProJahr,
      }));
      parsed.appData.teamZielwerte = []; // deprecated, leeren
    }

    // teamConfigs: fehlende neue Felder auffüllen (für ältere teamConfigs ohne SP/Stunden)
    parsed.appData.teamConfigs = parsed.appData.teamConfigs.map(c => ({
      ...c,
      storyPointsPerDay: c.storyPointsPerDay ?? 1,
      hoursPerYear: c.hoursPerYear ?? 1600,
    }));

    return parsed;
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

if (!loaded) persistState();

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
    case 'globalConfig':
      appData.globalConfig = data as AppData['globalConfig'];
      break;
    case 'teamConfigs':
      appData.teamConfigs = data as AppData['teamConfigs'];
      break;
    case 'piTeamTargets':
      appData.piTeamTargets = data as AppData['piTeamTargets'];
      break;
    case 'teamZielwerte':
      // deprecated – wird ignoriert, keine Persistierung
      console.warn('[StateManager] teamZielwerte-Event empfangen – wird ignoriert (deprecated).');
      return;
    default:
      console.warn(`[StateManager] Unbekannter changeType: ${changeType}`);
      return;
  }
  currentState = { ...currentState, appData };
  persistState();
}
