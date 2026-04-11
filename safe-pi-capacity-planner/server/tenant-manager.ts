// Tenant-Manager: Verwaltet mehrere Tenants (Trains) mit isolierten States
// Jeder Tenant hat eine eigene state_{tenantId}.json und einen Admin-Code-Hash

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import type { SavedProjectState, Employee, AllocationType, AppData } from '../src/types';
import { SEED_EMPLOYEES, SEED_PIS, SEED_FEIERTAGE, SEED_SCHULFERIEN, SEED_BLOCKER } from '../src/data/seed';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_RAILWAY = !!process.env.RAILWAY_ENVIRONMENT;
const DATA_DIR = IS_RAILWAY
  ? '/app/data'
  : join(__dirname, '..', 'data');

console.log(`[TenantManager] DATA_DIR: ${DATA_DIR} (Railway: ${IS_RAILWAY})`);

// Initial-Passwort für Demo-Train (konfigurierbar via Env-Var DEFAULT_ADMIN_CODE)
const DEFAULT_TENANT_ADMIN_CODE = process.env.DEFAULT_ADMIN_CODE ?? '000815';

// Tenant-ID-Validierung
const TENANT_ID_REGEX = /^[a-z0-9-]{2,20}$/;

export interface TenantMeta {
  id: string;           // z.B. "ps-net"
  name: string;         // z.B. "PS-NET Train"
  adminCodeHash: string;// bcryptjs.hashSync(adminCode, 10)
  createdAt: string;    // new Date().toISOString()
}

const TENANTS_FILE = join(DATA_DIR, 'tenants.json');
const INITIAL_GLOBAL_CONFIG: AppData['globalConfig'] = {
  spPerDay: 1,
  hoursPerYear: 1600,
};

// In-memory Cache: tenantId → State
const stateCache = new Map<string, SavedProjectState>();

// In-memory Tenant-Registry Cache
let tenantsCache: TenantMeta[] | null = null;

function ensureDataDir(): void {
  mkdirSync(DATA_DIR, { recursive: true });
}

// --- Tenant-Registry ---

function loadTenants(): TenantMeta[] {
  if (tenantsCache !== null) return tenantsCache;
  try {
    if (!existsSync(TENANTS_FILE)) return [];
    const raw = readFileSync(TENANTS_FILE, 'utf-8');
    tenantsCache = JSON.parse(raw) as TenantMeta[];
    return tenantsCache;
  } catch (err) {
    console.warn('[TenantManager] tenants.json konnte nicht geladen werden:', err);
    tenantsCache = [];
    return tenantsCache;
  }
}

function saveTenants(tenants: TenantMeta[]): void {
  try {
    ensureDataDir();
    writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
    tenantsCache = tenants;
  } catch (err) {
    console.error('[TenantManager] tenants.json konnte nicht gespeichert werden:', err);
  }
}

// --- State-Hilffunktionen ---

function getTenantStateFile(tenantId: string): string {
  return join(DATA_DIR, `state_${tenantId}.json`);
}

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

function loadStateFromFile(tenantId: string): SavedProjectState {
  const stateFile = getTenantStateFile(tenantId);
  try {
    if (!existsSync(stateFile)) {
      console.log(`[TenantManager] Kein State für Tenant '${tenantId}' – SEED-Daten werden verwendet.`);
      const initial = buildInitialState();
      saveStateToFile(tenantId, initial);
      return initial;
    }
    const raw = readFileSync(stateFile, 'utf-8');
    const parsed = JSON.parse(raw) as SavedProjectState;

    // Fehlende Felder mit Defaults auffüllen (Migrationsschutz)
    parsed.appData.globalConfig ??= INITIAL_GLOBAL_CONFIG;
    parsed.appData.teamConfigs ??= [];
    parsed.appData.piTeamTargets ??= [];
    parsed.appData.teamZielwerte ??= [];

    // Migration: alte teamZielwerte → teamConfigs (einmalig)
    if (parsed.appData.teamConfigs.length === 0 && parsed.appData.teamZielwerte.length > 0) {
      console.log(`[TenantManager] Migriere teamZielwerte → teamConfigs für Tenant '${tenantId}'`);
      parsed.appData.teamConfigs = parsed.appData.teamZielwerte.map(z => ({
        teamName: z.team,
        minPikett: z.minPersonenPikett,
        minBetrieb: z.minPersonenBetrieb,
        storyPointsPerDay: z.storyPointsPerDay,
        hoursPerYear: z.standardstundenProJahr,
      }));
      parsed.appData.teamZielwerte = [];
    }

    // teamConfigs: fehlende neue Felder auffüllen
    parsed.appData.teamConfigs = parsed.appData.teamConfigs.map(c => ({
      ...c,
      storyPointsPerDay: c.storyPointsPerDay ?? 1,
      hoursPerYear: c.hoursPerYear ?? 1600,
    }));

    return parsed;
  } catch (err) {
    console.warn(`[TenantManager] State für Tenant '${tenantId}' konnte nicht geladen werden:`, err);
    return buildInitialState();
  }
}

function saveStateToFile(tenantId: string, state: SavedProjectState): void {
  try {
    ensureDataDir();
    writeFileSync(getTenantStateFile(tenantId), JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[TenantManager] State für Tenant '${tenantId}' konnte nicht gespeichert werden:`, err);
  }
}

// --- Migration: state.json → state_default.json ---

function runMigrationIfNeeded(): void {
  const legacyStateFile = join(DATA_DIR, 'state.json');
  if (!existsSync(legacyStateFile)) return;
  if (existsSync(TENANTS_FILE)) return;

  console.log('[TenantManager] Migration: state.json → state_default.json + Default-Tenant anlegen');

  try {
    ensureDataDir();

    // Default-Tenant anlegen
    const defaultTenant: TenantMeta = {
      id: 'default',
      name: 'Demo-Train',
      adminCodeHash: bcrypt.hashSync(DEFAULT_TENANT_ADMIN_CODE, 10),
      createdAt: new Date().toISOString(),
    };
    saveTenants([defaultTenant]);
    console.log(`[TenantManager] Demo-Train initialer Admin-Code: ${DEFAULT_TENANT_ADMIN_CODE}`);

    // state.json → state_default.json kopieren (nicht löschen)
    const targetFile = getTenantStateFile('default');
    if (!existsSync(targetFile)) {
      copyFileSync(legacyStateFile, targetFile);
      console.log('[TenantManager] state.json → state_default.json kopiert.');
    }
  } catch (err) {
    console.error('[TenantManager] Migration fehlgeschlagen:', err);
  }
}

// Migration beim Modulstart ausführen
runMigrationIfNeeded();

// Falls keine Tenants existieren, Default-Tenant anlegen
function ensureDefaultTenant(): void {
  const tenants = loadTenants();
  if (tenants.length === 0) {
    console.log('[TenantManager] Keine Tenants gefunden – Default-Tenant anlegen');
    const defaultTenant: TenantMeta = {
      id: 'default',
      name: 'Demo-Train',
      adminCodeHash: bcrypt.hashSync(DEFAULT_TENANT_ADMIN_CODE, 10),
      createdAt: new Date().toISOString(),
    };
    saveTenants([defaultTenant]);
    console.log(`[TenantManager] Demo-Train initialer Admin-Code: ${DEFAULT_TENANT_ADMIN_CODE}`);
  }
}

ensureDefaultTenant();

// --- Exportierte Funktionen ---

export function listTenants(): Omit<TenantMeta, 'adminCodeHash'>[] {
  return loadTenants().map(({ id, name, createdAt }) => ({ id, name, createdAt }));
}

export function getTenant(tenantId: string): TenantMeta | null {
  const tenants = loadTenants();
  return tenants.find(t => t.id === tenantId) ?? null;
}

export function createTenant(id: string, name: string, adminCode: string): Omit<TenantMeta, 'adminCodeHash'> {
  if (!TENANT_ID_REGEX.test(id)) {
    throw new Error(`Ungültige Tenant-ID: '${id}'. Erlaubt: Kleinbuchstaben, Ziffern, Bindestrich, 2–20 Zeichen.`);
  }

  const tenants = loadTenants();
  if (tenants.some(t => t.id === id)) {
    throw new Error(`Tenant '${id}' existiert bereits.`);
  }

  const newTenant: TenantMeta = {
    id,
    name,
    adminCodeHash: bcrypt.hashSync(adminCode, 10),
    createdAt: new Date().toISOString(),
  };

  saveTenants([...tenants, newTenant]);

  // Initialen State für neuen Tenant anlegen
  const initial = buildInitialState();
  saveStateToFile(id, initial);

  console.log(`[TenantManager] Neuer Tenant '${id}' angelegt.`);
  return { id, name, createdAt: newTenant.createdAt };
}

export function verifyAdminCode(tenantId: string, code: string): boolean {
  const tenant = getTenant(tenantId);
  if (!tenant) return false;
  return bcrypt.compareSync(code, tenant.adminCodeHash);
}

export function getTenantState(tenantId: string): SavedProjectState {
  if (stateCache.has(tenantId)) {
    return stateCache.get(tenantId)!;
  }
  const state = loadStateFromFile(tenantId);
  stateCache.set(tenantId, state);
  return state;
}

export function setTenantState(tenantId: string, state: SavedProjectState): void {
  stateCache.set(tenantId, state);
  saveStateToFile(tenantId, state);
}

export function applyTenantAllocationChange(
  tenantId: string,
  employeeId: string,
  dateStr: string,
  type: AllocationType,
): void {
  const current = getTenantState(tenantId);
  const updated: SavedProjectState = {
    ...current,
    employees: current.employees.map(emp => {
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
  setTenantState(tenantId, updated);
}

export function applyTenantSettingsChange(tenantId: string, changeType: string, data: unknown): void {
  const current = getTenantState(tenantId);

  if (changeType === 'employees') {
    setTenantState(tenantId, { ...current, employees: data as Employee[] });
    return;
  }

  const appData = { ...current.appData };
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
      // deprecated – wird ignoriert
      console.warn('[TenantManager] teamZielwerte-Event empfangen – wird ignoriert (deprecated).');
      return;
    default:
      console.warn(`[TenantManager] Unbekannter changeType: ${changeType}`);
      return;
  }
  setTenantState(tenantId, { ...current, appData });
}

export function resetTenantState(tenantId: string): void {
  const initial = buildInitialState();
  setTenantState(tenantId, initial);
  console.log(`[TenantManager] State für Tenant '${tenantId}' zurückgesetzt.`);
}

export function updateTenant(tenantId: string, updates: { name?: string; newAdminCode?: string }): void {
  const tenants = loadTenants();
  const idx = tenants.findIndex(t => t.id === tenantId);
  if (idx === -1) throw new Error(`Tenant '${tenantId}' nicht gefunden.`);

  const updated = { ...tenants[idx] };
  if (updates.name !== undefined) {
    updated.name = updates.name;
  }
  if (updates.newAdminCode !== undefined) {
    updated.adminCodeHash = bcrypt.hashSync(updates.newAdminCode, 10);
  }
  tenants[idx] = updated;
  saveTenants(tenants);
  console.log(`[TenantManager] Tenant '${tenantId}' aktualisiert.`);
}
