// Feature 29: Schema-Migrationen für PIPlanning
//   1.0 → 1.5: blockerWeeks/zeremonien-Arrays als [] defaulten, Demo-PI26-2 entfernen
//   1.5 → 1.6: Zeremonien um startDate/endDate/endTime erweitern (aus durationMinutes berechnet)
// Pure functions, keine Seiteneffekte.

import type { FullAppState, PIPlanning, PiDefinition, PIZeremonie } from '../types';
import { addMinutes } from './pi-calculator';

/** Name des Demo-PIs aus ARTFlow, das beim ersten 1.5-Migrationspass entfernt wird */
const DEMO_PI_NAME = 'PI26-2';

/**
 * Prüft, ob ein PI-Objekt bereits dem Schema 1.5 entspricht
 * (besitzt blockerWeeks und zeremonien als definierte Arrays).
 */
function isMigrated15(pi: PIPlanning | PiDefinition): boolean {
  return Array.isArray(pi.blockerWeeks) && Array.isArray(pi.zeremonien);
}

/**
 * Schema 1.5 → 1.6: Setzt startDate/endDate/endTime aus 1.5-Feldern (date+startTime+durationMinutes).
 * Idempotent — wenn die 1.6-Felder bereits gesetzt sind, bleiben sie unverändert.
 */
export function migrateZeremonieToSchema16(z: PIZeremonie): PIZeremonie {
  if (z.startDate && z.endDate && z.endTime) return z;
  const startDate = z.startDate ?? z.date;
  const computed = addMinutes(startDate, z.startTime, z.durationMinutes);
  return {
    ...z,
    startDate,
    endDate: z.endDate ?? computed.date,
    endTime: z.endTime ?? computed.time,
  };
}

/**
 * Migriert eine PI-Liste auf das aktuelle Schema (1.6):
 *  - 1.0 → 1.5: blockerWeeks/zeremonien als [] defaulten, Demo-PI26-2 entfernen
 *  - 1.5 → 1.6: jede Zeremonie via migrateZeremonieToSchema16 ergänzen
 */
export function migratePIs<T extends PIPlanning | PiDefinition>(pis: T[]): T[] {
  return pis
    .filter(pi => isMigrated15(pi) || pi.name !== DEMO_PI_NAME)
    .map(pi => {
      // Schritt 1: Schema 1.4/1.0 → 1.5
      const stage15 = isMigrated15(pi)
        ? pi
        : {
            ...pi,
            blockerWeeks: pi.blockerWeeks ?? [],
            zeremonien: pi.zeremonien ?? [],
          };
      // Schritt 2: Schema 1.5 → 1.6 (Zeremonien-Felder ergänzen)
      const zeremonien = (stage15.zeremonien ?? []).map(migrateZeremonieToSchema16);
      return { ...stage15, zeremonien };
    });
}

/**
 * Migriert einen kompletten FullAppState auf Schema 1.6.
 * Wird sowohl beim Backup-Restore als auch beim Laden des Server-States verwendet.
 */
export function migrateStateToSchema16(state: FullAppState): FullAppState {
  return {
    ...state,
    pis: migratePIs(state.pis),
  };
}

/**
 * @deprecated Alias für `migrateStateToSchema16` — Backwards-Compat für externe Aufrufe.
 * Wird in einem späteren Cleanup entfernt.
 */
export const migrateStateToSchema15 = migrateStateToSchema16;
