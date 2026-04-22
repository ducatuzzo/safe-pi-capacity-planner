# Feature 22: Custom Allocation Types (Individuelle Buchungstypen)

## Session-Typ: IMPL (komplex — eigene Session, mehrteilig)

## Voraussetzungen (immer zuerst lesen!)
1. Lies AI.md → Abschnitt Datenmodell (Kern) + AllocationType
2. Lies STATUS.md → Prüfe ob Features 20/21 deployed sind
3. Prüfe: Existiert `src/utils/sp-calculator.ts`? → Das ist die kritische Datei
4. Prüfe: Existiert `src/types.ts`? → Employee.allocations Typ muss geändert werden

## Recovery-Protokoll
**ACHTUNG: Feature 22 ist ein Breaking Change.** `Employee.allocations` ändert sich von `Record<string, AllocationType>` zu `Record<string, string>`. Fehler hier brechen Kalender, SP-Berechnung, Dashboard und Backup gleichzeitig.

### Bei Context Rot oder Fehler:
1. **Sofort stoppen** — nicht im gleichen Chat weitermachen
2. STATUS.md aktualisieren — eintragen welcher Implementierungsschritt abgebrochen wurde (1–8)
3. `git diff` prüfen — welche Dateien bereits geändert sind
4. Neuen Chat öffnen
5. Laden in dieser Reihenfolge:
   - AI.md
   - STATUS.md
   - features/feature-22-custom-allocation-types.md (dieses Dokument)
6. Agent fasst zusammen was bereits geändert wurde — erst dann weitermachen

### Bei kaputtem Build nach Typ-Änderung:
1. `git stash` — Änderungen sichern
2. `npx tsc --noEmit` — TypeScript-Fehler auflisten
3. Jeden Fehler = eine Stelle die `AllocationType` direkt liest statt über Helper
4. Systematisch alle Stellen über `allocation-helpers.ts` umleiten

### Backup-Migration prüfen:
1. Bestehenden Backup laden → `customAllocationTypes` fehlt → muss als `[]` defaulten
2. Allocation-Werte in Employee.allocations → alle müssen als `string` validierbar sein
3. Custom-Type-IDs in allocations die nicht in `customAllocationTypes` existieren → Warnung, nicht Block

## Hintergrund
Teams im PS-NET Train brauchen eigene Buchungskürzel neben den 8 Standard-Typen. Beispiel: Team PAF nutzt "R" = Portöffnungen (Farbe #FE58B3, Text #1A1A1A). Das sind explizit ausgewiesene Aufwände die zugewiesen werden — nicht für Jira-Planung verfügbare SP.

Jeder Custom-Typ muss einer **Berechnungskategorie** zugeordnet werden, damit SP-Berechnung, Dashboard und Lücken-Erkennung korrekt rechnen.

## Architektur-Entscheidung: Fester Kern + dynamische Custom-Types

### Warum nicht AllocationType erweitern?
`AllocationType` ist ein fester TypeScript-Union-Type. Er wird in `Record<AllocationType, ...>` für FarbConfig, Labels, SP-Faktoren, Buchstaben verwendet. Ein dynamischer Union ist in TypeScript unmöglich. Stattdessen:

### Lösung: Zwei Ebenen
1. **Built-in Types** bleiben unverändert: `AllocationType` bleibt fester Union
2. **Custom Types** werden als `string` im `allocations`-Record gespeichert (`Record<string, string>`)
3. Ein neues `CustomAllocationType`-Interface beschreibt Kürzel, Label, Farbe und **Kategorie**
4. Lookup-Funktionen prüfen erst Built-in, dann Custom

### Berechnungskategorien
```typescript
type AllocationCategory =
  | 'ABSENCE'    // Wie FERIEN/ABWESEND/MILITAER/IPA — SP = 0, zählt als Abwesenheit
  | 'BETRIEB'    // Wie BETRIEB — SP = 0 für Jira, zählt als Betriebstag
  | 'PIKETT'     // Wie PIKETT — SP = 0 für Jira, zählt als Pikett-Tag
  | 'BETRIEB_PIKETT' // Wie BETRIEB_PIKETT — zählt für beide Lücken-Checks
  | 'NEUTRAL';   // SP = 0 für Jira-Planung, aber kein Abzug, keine Lücken-Relevanz (z.B. Portöffnungen)
```

## Neues Interface

### types.ts
```typescript
export type AllocationCategory = 'ABSENCE' | 'BETRIEB' | 'PIKETT' | 'BETRIEB_PIKETT' | 'NEUTRAL';

export interface CustomAllocationType {
  id: string;           // Interner Key, z.B. 'CUSTOM_R_PAF' (auto-generiert)
  kuerzel: string;      // Anzeigekürzel im Kalender, z.B. 'R' (max. 3 Zeichen)
  label: string;        // Bezeichnung, z.B. 'Portöffnungen'
  bg: string;           // Hintergrundfarbe Hex, z.B. '#FE58B3'
  text: string;         // Schriftfarbe Hex, z.B. '#1A1A1A'
  category: AllocationCategory; // Berechnungskategorie
  team?: string;        // Optional: Team-Zugehörigkeit (leer = für alle Teams)
}
```

### Employee.allocations ändern
```typescript
// ALT:
allocations: Record<string, AllocationType>;

// NEU:
allocations: Record<string, string>; // Wert = AllocationType | CustomAllocationType.id
```

**ACHTUNG:** Das ändert den Typ von `allocations`. Alle Stellen die `AllocationType` aus allocations lesen, brauchen eine Lookup-Funktion.

### AppData / FullAppState erweitern
```typescript
customAllocationTypes?: CustomAllocationType[];
```

## Schema-Migration für Backup/Restore
```typescript
// Beim Laden eines Backups:
function migrateBackup(data: any): AppData {
  // 1. customAllocationTypes defaulten
  if (!data.customAllocationTypes) {
    data.customAllocationTypes = [];
  }
  // 2. Employee.allocations: Werte sind bereits strings (JSON-kompatibel)
  //    Keine Migration nötig — AllocationType-Strings bleiben gültig
  // 3. Orphan-Check: Custom-IDs in allocations die nicht in customAllocationTypes existieren
  //    → Warnung loggen, Allocation entfernen oder beibehalten (Warnung bevorzugt)
  return data;
}
```

## Betroffene Dateien und Änderungen

### 1. types.ts
- `AllocationCategory` Type hinzufügen
- `CustomAllocationType` Interface hinzufügen
- `Employee.allocations` → `Record<string, string>`
- `AppData.customAllocationTypes` hinzufügen
- `FullAppState.customAllocationTypes` hinzufügen

### 2. Neue Datei: src/utils/allocation-helpers.ts
Zentrale Lookup-Funktionen die ALLE Komponenten nutzen:
```typescript
function isBuiltinType(value: string): value is AllocationType
function findCustomType(value: string, customTypes: CustomAllocationType[]): CustomAllocationType | undefined
function getAllocationLetter(value: string, customTypes: CustomAllocationType[]): string
function getAllocationColors(value: string, farbConfig: FarbConfig, customTypes: CustomAllocationType[]): { bg: string; text: string }
function getAllocationSpFactor(value: string, customTypes: CustomAllocationType[]): number
function isAbsenceType(value: string, customTypes: CustomAllocationType[]): boolean
function isBetriebType(value: string, customTypes: CustomAllocationType[]): boolean
function isPikettType(value: string, customTypes: CustomAllocationType[]): boolean
```

### 3. src/utils/sp-calculator.ts
- `ABSENCE_TYPES`, `BETRIEB_TYPES`, `PIKETT_TYPES` Sets ersetzen durch Helper-Aufrufe
- `calculateSPForEmployee()`: `customTypes` als Parameter
- `calculateSPForTeam()`: `customTypes` durchreichen, Lücken-Check anpassen

### 4. src/components/calendar/CalendarCell.tsx
- `ALLOCATION_LETTER` Record → `getAllocationLetter()`
- `getCellStyle()` → `getAllocationColors()`
- Props: `customTypes: CustomAllocationType[]`

### 5. src/components/calendar/CalendarGrid.tsx
- Buchungstyp-Dropdown: Custom-Types hinzufügen
- `customTypes` an `CalendarCell` durchreichen
- Legende: Custom-Types mit Kürzel, Farbe, Label

### 6. src/components/settings/FarbeinstellungenSettings.tsx
- Custom-Types in Vorschau (nicht editierbar hier)

### 7. Neue Komponente: src/components/settings/CustomAllocationSettings.tsx
- CRUD, Validierung, CSV Import/Export
- Kürzel-Kollisionsprüfung mit Built-in (F, A, T, M, I, B, BP, P)

### 8. src/components/settings/SettingsPage.tsx
- Sidebar: "Buchungstypen" (zwischen Farbeinstellungen und Backup)

### 9. src/constants.ts
- `ALLOCATION_CATEGORY_LABEL` für Dropdown

### 10. Backend: server/state-manager.ts
- `customAllocationTypes` persistieren + Socket.io-Event

### 11. Backup/Restore
- `customAllocationTypes` einschliessen, Migration (s.o.)

### 12. Legende
- Custom-Types mit Gruppierung: Built-in | Custom

## Akzeptanzkriterien
- [ ] Custom-Buchungstypen in Einstellungen → Buchungstypen verwalten (CRUD)
- [ ] Kürzel (max 3 Zeichen), Label, Hintergrundfarbe, Schriftfarbe, Kategorie-Dropdown
- [ ] Keine Kürzel-Kollision mit Built-in-Types (F, A, T, M, I, B, BP, P)
- [ ] Custom-Types erscheinen im Kalender-Buchungs-Dropdown
- [ ] Custom-Types werden im Kalender mit Kürzel + Farbe korrekt dargestellt
- [ ] Legende zeigt Custom-Types
- [ ] SP-Berechnung berücksichtigt Custom-Type-Kategorie korrekt
- [ ] Dashboard: Lücken-Erkennung berücksichtigt Custom-Betrieb/Pikett-Types
- [ ] Backup/Restore enthält Custom-Types + Migration für alte Backups
- [ ] Socket.io synchronisiert Custom-Types
- [ ] CSV Export/Import für Custom-Types
- [ ] Rückwärtskompatibilität: Backups ohne Custom-Types laden fehlerfrei

## Reihenfolge der Implementierung (empfohlen)
1. types.ts + allocation-helpers.ts (Fundament)
2. sp-calculator.ts anpassen (Berechnung)
3. CustomAllocationSettings.tsx + SettingsPage.tsx (UI-Verwaltung)
4. CalendarCell.tsx + CalendarGrid.tsx (Kalender-Rendering + Legende + Dropdown)
5. FarbeinstellungenSettings.tsx (Custom-Types in Vorschau)
6. Backend state-manager.ts + Socket.io
7. Backup/Restore anpassen + Schema-Migration
8. Testen

## Konventionen (CLAUDE.md)
- Deutsch: UI-Labels, Kommentare
- Englisch: Variablen, Funktionen, Typen
- Kein `any` — der `allocations`-Typ wird `Record<string, string>`, nicht `Record<string, any>`
- Keine inline styles ausser dynamische Hex-Farben (wie bei FarbConfig)
- Kein neues npm-Paket
- Dokumentation nachführen: AI.md (Datenmodell), Benutzerdokumentation
