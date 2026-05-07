// Feature 29: Schema-Migrationen für PIPlanning (Schema 1.0 → 1.5)
// Pure functions, keine Seiteneffekte.

import type { FullAppState, PIPlanning, PiDefinition } from '../types';

/** Name des Demo-PIs aus ARTFlow, das beim ersten 1.5-Migrationspass entfernt wird */
const DEMO_PI_NAME = 'PI26-2';

/**
 * Prüft, ob ein PI-Objekt bereits dem Schema 1.5 entspricht
 * (besitzt blockerWeeks und zeremonien als definierte Arrays).
 */
function isMigrated(pi: PIPlanning | PiDefinition): boolean {
  return Array.isArray(pi.blockerWeeks) && Array.isArray(pi.zeremonien);
}

/**
 * Migriert eine PI-Liste auf Schema 1.5:
 *  - Fügt fehlende Felder (blockerWeeks=[], zeremonien=[]) hinzu
 *  - Entfernt das Demo-PI „PI26-2" beim ersten Migrationspass
 *    (nur PIs ohne die neuen Felder gelten als un-migriert; ein nach 1.5
 *     neu angelegtes PI mit gleichem Namen würde NICHT entfernt)
 */
export function migratePIs<T extends PIPlanning | PiDefinition>(pis: T[]): T[] {
  return pis
    .filter(pi => isMigrated(pi) || pi.name !== DEMO_PI_NAME)
    .map(pi =>
      isMigrated(pi)
        ? pi
        : {
            ...pi,
            blockerWeeks: pi.blockerWeeks ?? [],
            zeremonien: pi.zeremonien ?? [],
          }
    );
}

/**
 * Migriert einen kompletten FullAppState auf Schema 1.5.
 * Wird sowohl beim Backup-Restore als auch beim Laden des Server-States verwendet.
 */
export function migrateStateToSchema15(state: FullAppState): FullAppState {
  return {
    ...state,
    pis: migratePIs(state.pis),
  };
}
