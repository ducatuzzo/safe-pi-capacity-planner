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
export interface Iteration extends DateRangeDefinition {
  // erbt id, name, startStr, endStr
}

// PI-Planung mit Iterationen (kanonisch, für Feature 02)
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

// Zielwerte pro Team (kanonisch, für Feature 02)
export interface TeamTargets {
  teamName: string;
  pikettMin: number;
  betriebMin: number;
  spPerDay: number;
  stdHoursPerYear: number;
}

// Zielwerte pro Team (Legacy-Alias mit deutschen Feldnamen)
export interface TeamZielwerte {
  team: string;
  minPersonenPikett: number;
  minPersonenBetrieb: number;
  storyPointsPerDay: number;      // Standard: 1
  standardstundenProJahr: number; // Standard: 1600
}

// Feature 17: Globale SP-Parameter
export interface GlobalCapacityConfig {
  spPerDay: number;      // Standard: 1
  hoursPerYear: number;  // Standard: 1600
}

// Feature 17: Team-spezifische Mindestbesetzung
export interface TeamConfig {
  teamName: string;
  minPikett: number;  // Mindestanzahl PIKETT täglich (inkl. WE + Feiertage)
  minBetrieb: number; // Mindestanzahl BETRIEB pro Arbeitstag (exkl. WE + Feiertage)
}

// Feature 17: SP-Jira-Zielwert pro PI / Iteration / Team
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
  teamZielwerte: TeamZielwerte[];
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
  workDays: number;       // Arbeitstage ohne Wochenenden/Feiertage
  absenceDays: number;    // Tage mit FERIEN/ABWESEND/MILITAER/IPA
  betriebDays: number;    // Tage mit BETRIEB/BETRIEB_PIKETT
  pikettDays: number;     // Tage mit PIKETT/BETRIEB_PIKETT
  teilzeitDays: number;   // Tage mit TEILZEIT
}

// Ergebnis der SP-Berechnung pro Team
export interface TeamSPResult {
  team: string;
  totalAvailableSP: number;
  employees: EmployeeSPResult[];
  pikettGaps: string[];   // Datums-Strings wo < pikettMin Personen
  betriebGaps: string[];  // Datums-Strings wo < betriebMin Personen
}

// Ergebnis der SP-Berechnung pro Iteration
export interface IterationSPResult {
  iterationName: string;
  startStr: string;
  endStr: string;
  teams: TeamSPResult[];
  totalSP: number;
}

// Globaler Filter-State (gilt für alle Tabs gleichzeitig)
export interface FilterState {
  teams: string[];           // leer = alle Teams
  piId: string | null;       // null = alle PIs
  iterationId: string | null;
  year: number | null;
  dateFrom: string | null;   // YYYY-MM-DD
  dateTo: string | null;     // YYYY-MM-DD
}

// Aktiver Tab in der Navigation
export type ActiveTab = 'planung' | 'kapazitaet' | 'dashboard' | 'pidashboard' | 'settings';

// Settings-Unterseite
export type SettingsView =
  | 'mitarbeiter'
  | 'pi-planung'
  | 'feiertage'
  | 'schulferien'
  | 'blocker'
  | 'zielwerte'
  | 'team-konfiguration'
  | 'globale-parameter'
  | 'farben'
  | 'backup';

// Farbe (Hintergrund + Schrift) für einen Buchungstyp oder Kalenderbereich
export interface BuchungsFarbe {
  bg: string;   // Hex-Wert, z.B. '#FB923C'
  text: string; // Hex-Wert, z.B. '#FFFFFF'
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
  teamZielwerte: TeamZielwerte[];
  farbConfig?: FarbConfig;
  globalConfig?: GlobalCapacityConfig;
  teamConfigs?: TeamConfig[];
  piTeamTargets?: PITeamTarget[];
}

// Backup-Datei-Format (JSON-Export)
export interface BackupFile {
  version: string;        // z.B. "1.0"
  exportedAt: string;     // ISO 8601
  appVersion: string;     // z.B. "1.0.0"
  data: FullAppState;
}
