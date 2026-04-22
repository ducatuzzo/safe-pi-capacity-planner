# Preparation: Risiko-Mitigation vor Feature 22

## Session-Typ: PLAN (Risiken 1 + 3) und IMPL (Risiko 2) — siehe Auftrennung unten

## Hintergrund
Feature 22 (Custom Allocation Types) erweitert das Datenmodell grundlegend: `Employee.allocations` wechselt von `Record<string, AllocationType>` zu `Record<string, string>`, neue Entität `CustomAllocationType` kommt hinzu, SP-Berechnung muss dynamische Kategorien verarbeiten. Vor dieser Erweiterung müssen drei Altlasten addressiert werden, die sonst die Implementierung zum Scheitern bringen würden.

## Voraussetzungen (immer zuerst lesen!)
1. Lies AI.md → Datenmodell (Kern), Story Point Berechnung, Lücken-Erkennungs-Logik
2. Lies STATUS.md → Abschnitt "Bekannte Risiken"
3. Lies features/feature-11-backup-restore.md → Schema-Versionen, Migrations-Regeln
4. Lies features/feature-22-custom-allocation-types.md → was in Phase 5 kommt
5. Lies decisions/log.md → alle Einträge zu Backup, State-Manager, sp-calculator

## Die drei Risiken

### Risiko 1: JSON-Persistenz ohne Locking (PLAN-Session)

**Problem:** In `server/tenant-manager.ts` (und vorher `state-manager.ts`) wird State mit `writeFileSync` in `state_{tenantId}.json` persistiert. Bei gleichzeitigen Schreibzugriffen via Socket.io (zwei Planer editieren simultan) kann ein Race Condition auftreten: User A liest State, User B liest State, User A schreibt, User B schreibt → Änderung von User A ist verloren.

**Aktueller Stand:** Race Condition ist theoretisch möglich, praktisch bei <10 Nutzern selten. Nach Feature 22 steigt das Risiko, weil `customAllocationTypes` zusätzlich geschrieben wird und Settings-Dialoge länger offen bleiben.

**Zu entscheiden (PLAN):**
- Option A: **File-Lock via `proper-lockfile`** (npm-Paket, advisory locking auf OS-Ebene)
- Option B: **In-Memory Write-Queue** (serialize all writes pro Tenant via Promise-Chain)
- Option C: **Optimistic Locking mit Version-Feld** (jeder State hat `version`, Write verlangt aktuelle Version, Konflikt → Client muss neu laden)
- Option D: **Bewusst akzeptieren, dokumentieren** (Last-Write-Wins ist für internen Pilotbetrieb ok)

**Akzeptanzkriterien PLAN-Phase:**
- [ ] Eine der Optionen A–D ist gewählt, in decisions/log.md dokumentiert
- [ ] Implementierungsaufwand grob geschätzt (S/M/L)
- [ ] Falls A/B/C gewählt: Feature-Datei `feature-preparation-01-locking.md` mit Akzeptanzkriterien erstellt
- [ ] Falls D gewählt: Warnung in Benutzerdokumentation aufgenommen ("nicht parallel dieselben Daten editieren")

### Risiko 2: Keine Unit-Tests für SP-Berechnung (IMPL-Session, eigene Session)

**Problem:** `src/utils/sp-calculator.ts` enthält die pure functions `calculateSPForEmployee`, `calculateSPForTeam`, `getSpRaw` etc. Diese sind ungetestet. Feature 22 modifiziert alle drei Funktionen massgeblich (Custom-Types via Kategorie auflösen). Ohne Test-Baseline ist jede Regression unsichtbar.

**Zu tun (IMPL):**
- Test-Framework aufsetzen (Vitest — passt zu Vite, keine Jest-Migration nötig)
- Tests für mindestens folgende Szenarien:
  1. Mitarbeiter 100% FTE, keine Buchungen → SP = Arbeitstage × spPerDay
  2. Mitarbeiter 80% FTE → SP = 0.8 × Basis-SP
  3. Mitarbeiter mit betriebPercent=20 → SP-Abzug 20%
  4. Mitarbeiter mit pauschalPercent=10 → SP-Abzug 10%
  5. Buchung FERIEN → Tag zählt 0 SP
  6. Buchung TEILZEIT → Tag zählt 0.5 × spPerDay SP
  7. Buchung BETRIEB/PIKETT/BETRIEB_PIKETT → Tag zählt 0 SP
  8. Wochenende → kein SP
  9. Feiertag → kein SP
  10. Blocker-Tag → zählt als normaler Arbeitstag (nicht als Absenz)
  11. Lücken-Check Betrieb: WE + Feiertage werden ignoriert
  12. Lücken-Check Pikett: gilt 7 Tage/Woche

**Akzeptanzkriterien IMPL-Phase:**
- [ ] Vitest installiert, `npm run test` funktioniert
- [ ] `src/utils/sp-calculator.test.ts` existiert mit mindestens 12 Tests
- [ ] Alle Tests grün gegen aktuelle Implementierung (Baseline festgehalten)
- [ ] Coverage für sp-calculator.ts > 80%
- [ ] Tests laufen auch in CI (falls vorhanden) — mindestens lokal `npm run test` dokumentiert
- [ ] README-Eintrag oder Installationshandbuch-Ergänzung: "Tests ausführen"

### Risiko 3: Backup-Schema-Migration für Version 1.4 vorbereiten (PLAN-Session)

**Problem:** Feature 22 erfordert Schema-Version 1.4 des Backup-Formats. Aktuell ist 1.3 (mit globalConfig, teamConfigs, piTeamTargets). Die Migrations-Logik in `src/utils/backup.ts` muss erweitert werden, damit:
- Backups in 1.3 nach Upgrade auf 1.4 ohne Datenverlust geladen werden
- `Employee.allocations` Werte als Strings validiert werden (waren vorher AllocationType-Union, sind ab 1.4 `Record<string, string>`)
- `customAllocationTypes` als leeres Array defaultet wenn fehlend
- Orphan-Checks definiert sind: Was passiert wenn eine Allocation auf eine nicht-existente Custom-Type-ID referenziert?

**Zu entscheiden (PLAN):**
- Migrations-Strategie: Inline in `loadBackup()` vs. separate `migrations/`-Ordner mit nummerierten Dateien
- Orphan-Verhalten: Allocation entfernen, auf NONE setzen, oder beibehalten mit Warnung?
- Vorwärts-Kompatibilität: Kann ein 1.4-Backup in einer älteren App-Version geladen werden? (Nein — Major-Bump hätte das verlangt, aber 1.4 ist Minor)
- Dokumentation: wo werden Schema-Versionen gepflegt? (Aktuell in feature-11-backup-restore.md)

**Akzeptanzkriterien PLAN-Phase:**
- [ ] Migrations-Strategie gewählt, in decisions/log.md dokumentiert
- [ ] Orphan-Verhalten definiert, in feature-11-backup-restore.md eingetragen
- [ ] Skelett der Migrations-Funktion in feature-22 dokumentiert (noch nicht implementiert)
- [ ] Test-Szenarien für Migration definiert (werden Teil von Risiko 2 oder von Feature 22)

## Reihenfolge der Sessions
1. **Session 1 (PLAN):** Risiko 1 + Risiko 3 — Architektur-Entscheidungen, Dokumentation
2. **Session 2 (IMPL):** Risiko 2 — Vitest aufsetzen, 12+ Tests schreiben, Baseline festhalten
3. **Danach:** Feature 22 kann beginnen

## Verbote
- Kein Feature 22 Code schreiben — nur Vorbereitung
- Keine Änderung an sp-calculator.ts ausser es ist für Testbarkeit nötig (z.B. exportieren von bisher internen Helper-Funktionen)
- Keine neuen npm-Pakete ausser Vitest (Risiko 2) und ggf. proper-lockfile (Risiko 1, falls Option A gewählt)

## Nach den Sessions
- STATUS.md: "Bekannte Risiken" aktualisieren (welche sind mitigiert, welche bleiben)
- decisions/log.md: neue Einträge chronologisch
- PRD.md: Erfolgskriterium für Phase 5 erweitern ("Test-Baseline für SP-Berechnung vorhanden")
- CLAUDE.md: `npm run test` in Starten-Sektion ergänzen
