// Alle Interfaces und Typen für den SAFe PI Capacity Planner

// Buchungstypen für Mitarbeiter-Kalender
export type AllocationType =
  | 'NONE'
  | 'FERIEN'
  | 'ABWESEND'
  | 'TEILZEIT'
  | 'MILITAER'
  | 'IPA'
  | 'BETRIEB'
  | 'BETRIEB_PIKETT'
  | 'PIKETT';

// Mitarbeitertyp: interner oder externer Mitarbeiter
export type EmployeeType = 'iMA' | 'eMA';

// Mitarbeiter
export interface Employee {
  id: string;
  vorname: string;
  name: string;
  team: string;
  type: EmployeeType;
  fte: number;                // z.B. 0.8 für 80%
  capacityPercent: number;    // Verfügbarkeit in % (z.B. 80)
  betriebPercent: number;     // Betriebsanteil in % (z.B. 20)
  pauschalPercent: number;    // Pauschale in % (z.B. 5)
  storyPointsPerDay: number;  // Standard: 1
  allocations: Record<string, AllocationType>; // Key: YYYY-MM-DD
}

// Datumsbereich (für PI, Iteration, Feiertag, etc.)
export interface DateRangeDefinition {
  id: string;
  name: string;
  startStr: string; // YYYY-MM-DD
  endStr: string;   // YYYY-MM-DD
}

// Iteration innerhalb eines PI
export interface Iteration extends DateRangeDefinition {}

// PI-Planung mit Iterationen (kanonisch)
export interface PIPlanning extends DateRangeDefinition {
  iterationen: Iteration[];
}

// PI-Planung mit Iterationen (Legacy-Alias, für Rückwärtskompatibilität)
export interface PiDefinition extends DateRangeDefinition {
  iterationen: Iteration[];
}

// Feiertag
export interface Feiertag extends DateRangeDefinition {}

// Schulferien
export interface Schulferien extends DateRangeDefinition {}

// Blocker / Spezielle Periode (z.B. Change Freeze)
export interface Blocker extends DateRangeDefinition {}

// @deprecated – wird nur noch für Backup-Kompatibilität gehalten.
// Aktiv wird ausschliesslich TeamConfig verwendet.
export interface TeamZielwerte {
  team: string;
  minPersonenPikett: number;
  minPersonenBetrieb: number;
  storyPointsPerDay: number;
  standardstundenProJahr: number;
}

// Feature 17: Globale SP-Parameter
export interface GlobalCapacityConfig {
  spPerDay: number;      // Standard: 1
  hoursPerYear: number;  // Standard: 1600
}

// Team-Konfiguration: Mindestbesetzung + Kapazitätsparameter pro Team
// Einzige aktive Quelle der Wahrheit (ersetzt TeamZielwerte)
export interface TeamConfig {
  teamName: string;
  minPikett: number;         // Mindestanzahl PIKETT täglich (inkl. WE + Feiertage)
  minBetrieb: number;        // Mindestanzahl BETRIEB pro Arbeitstag (exkl. WE + Feiertage)
  storyPointsPerDay: number; // SP pro Tag für dieses Team (Standard: 1)
  hoursPerYear: number;      // Arbeitsstunden pro Jahr für dieses Team (Standard: 1600)
}

// SP-Jira-Zielwert pro PI / Iteration / Team
export interface PITeamTarget {
  piId: string;
  iterationId: string;
  teamName: string;
  spJira: number;
}

// Gesamte Applikationsdaten
export interface AppData {
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  pis: PiDefinition[];
  blocker: Blocker[];
  teamZielwerte: TeamZielwerte[]; // @deprecated – nur noch für Backup-Migration
  globalConfig: GlobalCapacityConfig;
  teamConfigs: TeamConfig[];
  piTeamTargets: PITeamTarget[];
}

// Vollständiger gespeicherter Projektzustand (Backup/Restore)
export interface SavedProjectState {
  version: string;
  timestamp: string; // ISO 8601
  year: number;
  employees: Employee[];
  appData: AppData;
}

// Ergebnis der SP-Berechnung pro Mitarbeiter
export interface EmployeeSPResult {
  employeeId: string;
  employeeName: string;
  team: string;
  availableSP: number;
  workDays: number;
  absenceDays: number;
  betriebDays: number;
  pikettDays: number;
  teilzeitDays: number;
}

// Ergebnis der SP-Berechnung pro Team
export interface TeamSPResult {
  team: string;
  totalAvailableSP: number;
  employees: EmployeeSPResult[];
  pikettGaps: string[];
  betriebGaps: string[];
}

// Ergebnis der SP-Berechnung pro Iteration
export interface IterationSPResult {
  iterationName: string;
  startStr: string;
  endStr: string;
  teams: TeamSPResult[];
  totalSP: number;
}

// Globaler Filter-State
export interface FilterState {
  teams: string[];
  piId: string | null;
  iterationId: string | null;
  year: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

// Aktiver Tab in der Navigation
export type ActiveTab = 'planung' | 'kapazitaet' | 'dashboard' | 'pidashboard' | 'settings' | 'admin';

// Tenant-Informationen (Feature 18 – Mandatenfähigkeit)
export interface TenantInfo {
  id: string;
  name: string;
  createdAt: string;
}

// Settings-Unterseite
export type SettingsView =
  | 'mitarbeiter'
  | 'pi-planung'
  | 'feiertage'
  | 'schulferien'
  | 'blocker'
  | 'team-konfiguration'
  | 'globale-parameter'
  | 'farben'
  | 'backup'
  | 'dokumentation';

// Farbe (Hintergrund + Schrift) für einen Buchungstyp oder Kalenderbereich
export interface BuchungsFarbe {
  bg: string;
  text: string;
}

// Farbkonfiguration für alle buchbaren Typen und Kalenderzustände
export interface FarbConfig {
  buchungstypen: Record<AllocationType, BuchungsFarbe>;
  kalender: {
    feiertag: BuchungsFarbe;
    schulferien: BuchungsFarbe;
    blocker: BuchungsFarbe;
    wochenende: BuchungsFarbe;
    heute: { text: string; bold: boolean };
  };
}

// Vollständiger exportierbarer App-Zustand (für Backup/Restore)
export interface FullAppState {
  employees: Employee[];
  feiertage: Feiertag[];
  schulferien: Schulferien[];
  pis: PiDefinition[];
  blocker: Blocker[];
  teamZielwerte?: TeamZielwerte[]; // @deprecated – wird bei Import zu teamConfigs migriert
  farbConfig?: FarbConfig;
  globalConfig?: GlobalCapacityConfig;
  teamConfigs?: TeamConfig[];
  piTeamTargets?: PITeamTarget[];
}

// Backup-Datei-Format (JSON-Export)
export interface BackupFile {
  version: string;
  exportedAt: string;
  appVersion: string;
  data: FullAppState;
}
