# Feature 22: Custom Allocation Types (Individuelle Buchungstypen)

## Session-Typ: IMPL (komplex — eigene Session, mehrteilig)

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
// Berechnungskategorie für Custom-Buchungstypen
export type AllocationCategory = 'ABSENCE' | 'BETRIEB' | 'PIKETT' | 'BETRIEB_PIKETT' | 'NEUTRAL';

// Custom-Buchungstyp (benutzerdefiniert, pro Tenant)
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
// In AppData und FullAppState:
customAllocationTypes?: CustomAllocationType[];
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
// Prüft ob ein Allocation-Wert ein Built-in-Type ist
function isBuiltinType(value: string): value is AllocationType

// Findet den Custom-Type zu einem Allocation-Wert
function findCustomType(value: string, customTypes: CustomAllocationType[]): CustomAllocationType | undefined

// Gibt Kürzel zurück (Built-in-Letter oder Custom-Kürzel)
function getAllocationLetter(value: string, customTypes: CustomAllocationType[]): string

// Gibt Farben zurück (Built-in aus FarbConfig oder Custom-Farbe)
function getAllocationColors(value: string, farbConfig: FarbConfig, customTypes: CustomAllocationType[]): { bg: string; text: string }

// Gibt SP-Faktor zurück (0 oder 1 oder 0.5, abhängig von Kategorie)
function getAllocationSpFactor(value: string, customTypes: CustomAllocationType[]): number

// Prüft ob Allocation zur Absenz zählt
function isAbsenceType(value: string, customTypes: CustomAllocationType[]): boolean

// Prüft ob Allocation zum Betrieb zählt
function isBetriebType(value: string, customTypes: CustomAllocationType[]): boolean

// Prüft ob Allocation zum Pikett zählt
function isPikettType(value: string, customTypes: CustomAllocationType[]): boolean
```

### 3. src/utils/sp-calculator.ts
- `ABSENCE_TYPES`, `BETRIEB_TYPES`, `PIKETT_TYPES` Sets ersetzen durch Aufrufe der Helper-Funktionen
- `getSpRaw()` erweitern: Custom-Types via Kategorie auflösen
- `calculateSPForEmployee()`: `customTypes` als Parameter hinzufügen
- `calculateSPForTeam()`: `customTypes` durchreichen, Lücken-Check anpassen
- Alle Aufrufstellen anpassen (appData.customAllocationTypes durchreichen)

### 4. src/components/calendar/CalendarCell.tsx
- `ALLOCATION_LETTER` Record ersetzen durch `getAllocationLetter()`
- `getCellStyle()`: Custom-Type-Farben via `getAllocationColors()`
- `isPikettType()`: Custom-Pikett-Types berücksichtigen
- Props: `customTypes: CustomAllocationType[]` hinzufügen

### 5. src/components/calendar/CalendarGrid.tsx
- Buchungstyp-Auswahl (Dropdown/Legende): Custom-Types zum Dropdown hinzufügen
- `customTypes` an `CalendarCell` durchreichen
- Legende erweitern: Custom-Types mit Kürzel, Farbe, Label anzeigen

### 6. src/components/settings/FarbeinstellungenSettings.tsx
- Custom-Types-Sektion unterhalb der Built-in-Buchungstypen anzeigen
- Custom-Types werden NICHT in FarbConfig.buchungstypen gespeichert (Farbe ist Teil des CustomAllocationType)
- Nur Vorschau anzeigen (Bearbeitung passiert in der Custom-Types-Verwaltung)

### 7. Neue Komponente: src/components/settings/CustomAllocationSettings.tsx
- CRUD für Custom-Buchungstypen
- Felder: Kürzel (max 3 Zeichen), Label, Hintergrundfarbe, Schriftfarbe, Kategorie (Dropdown), Team (optional)
- Vorschau-Zelle wie bei Farbeinstellungen
- CSV Import/Export
- Validierung: Kürzel darf nicht mit Built-in-Kürzeln kollidieren (F, A, T, M, I, B, BP, P)

### 8. src/components/settings/SettingsPage.tsx
- Neuer Sidebar-Eintrag: "Buchungstypen" (zwischen Farbeinstellungen und Backup)
- `SettingsView` um `'buchungstypen'` erweitern
- Props: `customAllocationTypes` + `onCustomAllocationTypesChange`

### 9. src/constants.ts
- `BUCHUNGSTYP_LABEL` und `BUCHUNGSTYP_FARBEN`: Bleiben für Built-in-Types, keine Änderung
- `ALLOCATION_CATEGORIES` Konstante mit Labels für Dropdown:
```typescript
export const ALLOCATION_CATEGORY_LABEL: Record<AllocationCategory, string> = {
  ABSENCE: 'Abwesenheit (SP = 0)',
  BETRIEB: 'Betrieb (zählt für Betrieb-Lücke)',
  PIKETT: 'Pikett (zählt für Pikett-Lücke)',
  BETRIEB_PIKETT: 'Betrieb + Pikett (zählt für beide)',
  NEUTRAL: 'Geplante Arbeit (SP = 0, keine Lücke)',
};
```

### 10. Backend: server/state-manager.ts
- `customAllocationTypes` in State aufnehmen und persistieren
- Socket.io-Event für Custom-Type-Änderungen

### 11. Backup/Restore
- `customAllocationTypes` im Backup einschliessen
- Migration: Backups ohne `customAllocationTypes` → leeres Array
- Validierung: Custom-Type-IDs in allocations müssen existieren (Warnung, nicht Block)

### 12. Legende (CalendarGrid oder separate Komponente)
- Custom-Types in Legende anzeigen mit Kürzel, Farbvorschau und Label
- Gruppierung: Built-in | Custom

## Akzeptanzkriterien
- [ ] Custom-Buchungstypen in Einstellungen → Buchungstypen verwalten (CRUD)
- [ ] Kürzel (max 3 Zeichen), Label, Hintergrundfarbe, Schriftfarbe, Kategorie-Dropdown
- [ ] Keine Kürzel-Kollision mit Built-in-Types (F, A, T, M, I, B, BP, P)
- [ ] Custom-Types erscheinen im Kalender-Buchungs-Dropdown
- [ ] Custom-Types werden im Kalender mit Kürzel + Farbe korrekt dargestellt
- [ ] Legende zeigt Custom-Types
- [ ] SP-Berechnung berücksichtigt Custom-Type-Kategorie korrekt
- [ ] Dashboard: Lücken-Erkennung berücksichtigt Custom-Betrieb/Pikett-Types
- [ ] Backup/Restore enthält Custom-Types
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
7. Backup/Restore anpassen
8. Testen

## Konventionen (CLAUDE.md)
- Deutsch: UI-Labels, Kommentare
- Englisch: Variablen, Funktionen, Typen
- Kein `any` — der `allocations`-Typ wird `Record<string, string>`, nicht `Record<string, any>`
- Keine inline styles ausser dynamische Hex-Farben (wie bei FarbConfig)
- Kein neues npm-Paket
- Dokumentation nachführen: AI.md (Datenmodell), Benutzerdokumentation
