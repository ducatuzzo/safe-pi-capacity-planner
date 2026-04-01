# Feature 02: Typen & Datenmodell

## Ziel
Vollständiges TypeScript-Typsystem in `types.ts`. Alle anderen Komponenten importieren von hier – kein `any`.

## Akzeptanzkriterien
- [x] `AllocationType` Enum vollständig (NONE, FERIEN, ABWESEND, TEILZEIT, MILITAER, IPA, BETRIEB, BETRIEB_PIKETT, PIKETT)
- [x] `Employee` Interface mit allen Feldern inkl. betriebPercent, pauschalPercent, storyPointsPerDay
- [x] `Iteration` Interface (id, name, startStr, endStr) – NEU gegenüber Altprojekt
- [x] `PIPlanning` Interface mit Iterationen-Array
- [x] `DateRangeDefinition` für Feiertage, Schulferien, Blocker
- [x] `TeamTargets` Interface (pikettMin, betriebMin, spPerDay, stdHoursPerYear)
- [x] `AppData` vollständig
- [x] `SavedProjectState` mit version + timestamp
- [x] Alle Types in `types.ts` zentralisiert

## Technische Details
```typescript
export interface Iteration extends DateRangeDefinition {
  // erbt id, name, startStr, endStr
}

export interface PIPlanning extends DateRangeDefinition {
  iterationen: Iteration[];
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  type: 'iMA' | 'eMA';
  fte: number;                    // 0.0–1.0 (z.B. 0.8 = 80%)
  capacityPercent: number;        // 0–100
  betriebPercent: number;         // 0–100
  pauschalPercent: number;        // 0–100
  storyPointsPerDay: number;      // default 1
  allocations: Record<string, AllocationType>;
}

export interface TeamTargets {
  teamName: string;
  pikettMin: number;
  betriebMin: number;
  spPerDay: number;
  stdHoursPerYear: number;
}
```

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (27.03.2026)
- [x] Tests: n/a (nur Typen, keine Laufzeit-Logik)

## Session-Typ: IMPL
