# Feature 11: Backup/Restore (JSON Export/Import, versioniert)

## Status
✅ Abgeschlossen (Stand: MVP Phase 1)

## Session-Typ: Referenz (keine aktive Implementierung)

## Ziel
Der gesamte App-State kann als versionierte JSON-Datei exportiert und wiederhergestellt werden. Backup ist die einzige zuverlässige Ausfallsicherung, da keine externe Datenbank verwendet wird.

## Voraussetzungen (bei jeder Änderung am Backup beachten)
1. Lies AI.md → Abschnitt "Datenmodell (Kern)" + "AppData (vollständig)"
2. Lies decisions/log.md → alle Einträge zu "Backup" und "Datenmodell"
3. Prüfe: Welche Felder im AppData sind optional (`?`) vs. pflicht?
4. Prüfe: Aktuelle Schema-Version der Backup-Datei

## Akzeptanzkriterien (erfüllt)
- [x] Export: Komplettes AppData als JSON mit Zeitstempel im Dateinamen
- [x] Import: JSON-Datei wird eingelesen, validiert, in State geladen
- [x] Versionierung: Backup enthält `schemaVersion` Feld
- [x] Rückwärtskompatibilität: Backups ohne neuere Felder laden mit Defaults
- [x] Multiuser: Restore emittiert `state:full` an alle verbundenen Clients (Socket.io)
- [x] Validierung: Fehlende Pflichtfelder → Fehlermeldung, kein partieller Import

## Datenmodell (Backup-Format)
```typescript
interface BackupFile {
  schemaVersion: string;       // z.B. "1.3"
  exportedAt: string;          // ISO-8601 Zeitstempel
  appData: AppData;            // kompletter State
  // Optional bei Tenant-Fähigkeit:
  tenantId?: string;
}
```

## Schema-Versionen (chronologisch)

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | März 2026 | Initial: feiertage, schulferien, pis, blocker, teamTargets |
| 1.1 | März 2026 | Feature 14: teamTargets erweitert |
| 1.2 | April 2026 | Feature 15: Multiuser-State-Struktur |
| 1.3 | April 2026 | Feature 17: globalConfig, teamConfigs, piTeamTargets hinzugefügt |
| 1.4 (geplant) | Phase 5 | Feature 22: customAllocationTypes, Employee.allocations als `Record<string, string>` |

## Migrations-Regeln
Beim Laden eines Backups mit älterer Schema-Version:
- Fehlende Felder → Default-Werte (leere Arrays, Config-Defaults aus AI.md)
- Deprecated Felder → in neue Struktur überführen (z.B. alte `teamZielwerte` → `teamConfigs`)
- Orphan-Referenzen (z.B. Allocation-Type existiert nicht mehr) → Warnung loggen, nicht blockieren
- Schema-Version fehlt → als 1.0 behandeln

## Betroffene Dateien
- `src/utils/backup.ts` — Export/Import-Logik, Validierung, Migration
- `src/components/settings/BackupSettings.tsx` — UI (Export-Button, Import-Dialog)
- `server/state-manager.ts` — setState + persistState bei Restore
- `server/tenant-manager.ts` — ab Feature 18: Backup pro Tenant

## Kritische Regeln (für Feature 22 und spätere Schema-Änderungen)
1. **Schema-Version IMMER erhöhen** bei Änderungen am AppData-Interface
2. **Migrations-Funktion IMMER vorwärts-kompatibel halten** — alte Backups müssen auch in 1 Jahr noch ladbar sein
3. **Nie Backup-Format brechen ohne Migration** — Breaking Change = neue Major-Version + Migrations-Code
4. **Feature 22 vorbereitend:** `Employee.allocations` Typ-Änderung von `Record<string, AllocationType>` zu `Record<string, string>` erfordert Schema 1.4 + Migrations-Schritt "validate allocation values as strings"

## Recovery-Protokoll bei Backup-Fehlern
1. User meldet "Backup lädt nicht"
2. Browser-Console prüfen → welcher Fehler?
3. JSON-Struktur validieren (manuell oder via `jq`)
4. Schema-Version prüfen — passt sie zur aktuellen App-Version?
5. Falls nein → Migrations-Code ergänzen, nicht Backup verändern
6. Falls ja → Validierungs-Regel zu streng, Default nachtragen

## Verbote
- Kein teilweiser Import (alles-oder-nichts)
- Kein Überschreiben ohne User-Bestätigung
- Keine externen Upload-Ziele (nur lokaler Download/Upload)

## Dokumentationspflicht
Bei jeder Änderung am Backup-Format:
- `docs/benutzerdokumentation_vX.Y.md` — Anleitung aktualisieren
- `docs/installationshandbuch_vX.Y.md` — falls Dateisystem-Pfade geändert
- `AI.md` — Schema-Version in AppData-Kommentar eintragen
- `decisions/log.md` — warum wurde die Schema-Version erhöht
