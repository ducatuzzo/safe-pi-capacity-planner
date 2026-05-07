# Feature 14: Team-Zielwerte konfigurierbar (Settings, CSV)

## Status
✅ Abgeschlossen (Stand: Phase 2 — deployed, Commit `1ee0095`)

## Session-Typ: Referenz (nachträglich dokumentiert)

> ⚠️ **Hinweis:** Diese Spezifikation wurde nachträglich erstellt.
> Feature 14 wurde ohne eigenes Feature-File implementiert (als Teil von `phase-2-planung.md`,
> archiviert am 16.04.2026). Der Inhalt wurde aus PRD.md, decisions/log.md,
> feature-17-team-config.md und dem implementierten Code rekonstruiert.

## Ziel
Team-spezifische Zielwerte (Mindestbesetzung Pikett und Betrieb) erstmals konfigurierbar
machen. Bis Feature 14 waren diese Werte hardcodiert in der SP-Berechnungslogik.
Das Feature führt eine konfigurierbare Tabelle im Settings-Tab ein, die dem Chapter Lead
erlaubt, Mindestbesetzungen pro Team zu definieren.

Feature 14 ist die erste Iteration dieses Konzepts.
**Feature 17 baut darauf auf und ersetzt es vollständig** durch eine robustere Architektur
(TeamConfig[], globalConfig, piTeamTargets[], CSV Import/Export).

## Abgrenzung zu Feature 17

| Aspekt | Feature 14 (diese Spec) | Feature 17 (späteres Feature) |
|--------|------------------------|-------------------------------|
| Scope | Einfache Zielwert-Tabelle pro Team | Vollständige Konfigurationsinfrastruktur |
| Lücken-Erkennung | teamTargets[] (einfach) | TeamConfig aus AppData (konfigurierbar) |
| Globale Parameter | Nicht vorhanden | SP/Tag, Std/Jahr editierbar |
| CSV | Kein Import/Export | Vollständiger CSV Import/Export |
| PI Dashboard | Erste Zielwert-Anzeige | Vollständiger SP Netto vs. Jira Vergleich |
| AppData-Feld | `teamTargets[]` (Legacy) | `globalConfig`, `teamConfigs[]`, `piTeamTargets[]` |

## Akzeptanzkriterien (erfüllt)

### Settings-Tab: Team-Zielwerte
- [x] Settings-Tab enthält Bereich "Team-Zielwerte"
- [x] Tabelle: Team | Min. Pikett | Min. Betrieb (Zeile pro Team aus Mitarbeiterstamm)
- [x] Teamnamen read-only (aus Mitarbeiterstamm abgeleitet, kein manuelles Eintragen)
- [x] Mindestbesetzungswerte editierbar via Inline-Edit (number input, min 0)
- [x] Änderungen werden sofort in `AppData.teamTargets` gespeichert
- [x] Via Socket.io an alle verbundenen Clients synchronisiert (`settings:change`)

### Dashboard: Lücken-Erkennung
- [x] Lücken-Erkennung greift auf konfigurierte Werte aus `teamTargets` zurück
- [x] Betrieb-Lücke: Arbeitstage (kein Wochenende, kein Feiertag) mit Unterbesetzung
- [x] Pikett-Lücke: alle Tage inkl. Wochenende und Feiertage bei Unterbesetzung
- [x] Dashboard zeigt Lücken als Liste mit Kalenderwochen-Angabe
- [x] Wenn keine Lücken: grünes Checkmark angezeigt

### Datenmodell
- [x] `teamTargets[]` in AppData (Legacy-Feld, abgelöst durch Feature 17)
- [x] Backup/Restore schliesst `teamTargets[]` ein
- [x] Alte Backups ohne `teamTargets[]` laden ohne Fehler (leeres Array als Default)

### Nicht in Feature 14 (erst Feature 17)
- CSV Import/Export für Teamkonfiguration
- Globale Parameter (SP/Tag, Stunden/Jahr) konfigurierbar
- PITeamTarget (Jira-SP vs. App-SP Vergleich)
- Vollständiges PI Dashboard mit Delta-Anzeige

## Datenmodell

### Legacy Interface (Feature 14)
Feature 14 führte `teamTargets[]` als ersten Ansatz ein. Dieses Interface wurde durch
Feature 17 durch `TeamConfig[]` und `PITeamTarget[]` ersetzt.

```typescript
// Legacy-Interface aus Feature 14 — erhalten für Backup-Kompatibilität
// Definiert in: src/types.ts
interface TeamTarget {
  teamName: string;
  minPikett: number;   // Mindestanzahl Pikett-Personen täglich (inkl. WE + Feiertage)
  minBetrieb: number;  // Mindestanzahl Betrieb-Personen an Arbeitstagen
}

// In AppData (Legacy-Feld, nicht mehr aktiv befüllen):
interface AppData {
  // ...
  teamTargets: TeamTarget[];  // LEGACY — ersetzt durch teamConfigs[] (Feature 17)
}
```

### Schema-Versionen
| Version | Änderung durch Feature 14 |
|---------|---------------------------|
| 1.0 | Initial: teamTargets[] noch nicht vorhanden |
| **1.1** | **Feature 14: teamTargets[] hinzugefügt** |
| 1.2 | Feature 15: Multiuser-State-Struktur |
| 1.3 | Feature 17: globalConfig, teamConfigs[], piTeamTargets[] |

### Migrations-Verhalten
- Backup mit `teamTargets[]` → wird geladen, durch Feature 17 in `teamConfigs[]` migriert
- Backup ohne `teamTargets[]` → leeres Array als Default (kein Fehler)
- Backup ohne `teamConfigs[]` → leeres Array + Seed-Daten als Default

## Geschäftsregeln: Lücken-Erkennung

Diese Regeln gelten unverändert auch in Feature 17 (ADR-005).
Feature 14 führte sie erstmals als konfigurierbare Werte ein (statt Hardcoding).

### Betrieb-Lücke
```
WENN anzahl(BETRIEB oder BETRIEB_PIKETT) pro Team an einem Tag < teamTarget.minBetrieb
UND tag ist Arbeitstag (kein Wochenende, kein gesetzlicher Feiertag)
→ Lücke melden
```

### Pikett-Lücke
```
WENN anzahl(PIKETT oder BETRIEB_PIKETT) pro Team an einem Tag < teamTarget.minPikett
UND tag liegt innerhalb PI-Zeitraum
→ Lücke melden (gilt auch WE + Feiertage)
```

> **Wichtig:** Diese Asymmetrie ist bewusst.
> Betrieb fällt an Weihnachten nicht an → kein Betrieb = keine Lücke.
> Pikett (Rufbereitschaft) gilt 365 Tage/Jahr → immer prüfen.

## Seed-Daten (Default-Konfiguration)

```typescript
// Formalisiert in Feature 17 als SEED_TEAM_CONFIGS
// Verwendet bereits seit Feature 14 als interne Defaults
const SEED_TEAM_TARGETS: TeamTarget[] = [
  { teamName: 'PAF', minPikett: 1, minBetrieb: 2 },  // Platform & Foundation
  { teamName: 'ACM', minPikett: 1, minBetrieb: 2 },  // Application Config Management
  { teamName: 'NET', minPikett: 0, minBetrieb: 1 },  // Netzwerk
  { teamName: 'CON', minPikett: 0, minBetrieb: 1 },  // Consulting
];
```

## Betroffene Dateien

| Datei | Änderung durch Feature 14 |
|-------|--------------------------|
| `src/types.ts` | `TeamTarget` Interface hinzugefügt, `teamTargets[]` zu AppData |
| `src/components/settings/` | Team-Zielwerte Sektion in Settings-Tab |
| `src/utils/sp-calculator.ts` | Lücken-Erkennung greift auf `teamTargets` zurück |
| `src/components/dashboard/LueckenListe.tsx` | Zeigt Pikett- und Betrieb-Lücken |
| `server/state-manager.ts` | `teamTargets` im State persistiert |

## Socket.io Event

```
Event:   settings:change
Payload: { type: "teamTargets", data: TeamTarget[] }
Richtung: Client → Server → broadcast an alle Clients im Tenant-Room
```

## Abhängigkeiten

| Feature | Abhängigkeit |
|---------|-------------|
| Feature 03 (Mitarbeiter) | Teamnamen werden aus Mitarbeiterstamm abgeleitet (read-only) |
| Feature 08 (SP-Berechnung) | Basis für Lücken-Erkennung |
| Feature 10 (Dashboard) | Zeigt Lücken-Ergebnis an |
| Feature 15 (Multiuser) | Socket.io State-Sync (parallel implementiert) |
| **Feature 17** | **Vollständige Nachfolge-Implementierung — ersetzt Feature 14** |

## Verbote

- `teamTargets[]` darf **nicht gelöscht** werden (Backup-Kompatibilität Schema 1.1)
- `teamTargets[]` darf **nicht aktiv befüllt** werden (nur noch Legacy-Ladelogik)
- Neue Funktionalität immer über `TeamConfig[]` aus Feature 17 implementieren
- Kein localStorage für Zielwerte (server-seitiger State per Socket.io)

## Kritische Regeln

1. `teamTargets[]` in AppData und in Backup-Migrations-Code **nie entfernen** — alte Backups (Schema 1.1) müssen ladbar bleiben
2. Bei Neuentwicklung: `TeamConfig[]` verwenden (Feature 17), nicht `TeamTarget[]`
3. Schema-Version 1.1 muss in der Migrations-Logik von `backup.ts` als bekannte Version behandelt werden

## Offene Punkte / Backlog

Keine offenen Punkte für Feature 14 — vollständig implementiert und durch Feature 17 abgelöst.

Folgende Punkte betreffen Roadmap-Features:
- **R-06 (Roadmap):** Rollen — nur Admin darf Zielwerte ändern
- **R-07 (Roadmap):** Custom Allocation Types beeinflussen Lücken-Erkennung (Feature 22 Vorstufe)
- **R-05 (Roadmap):** Audit-Log für Änderungen an Team-Zielwerten
