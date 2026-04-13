# decisions/log.md – Entscheidungslog

## 2026-03-27: Neuaufbau statt Refactoring
**Entscheidung:** Bestehende App (download_safe-pi-capacity-planner) wird nicht refactored, sondern neu aufgebaut.
**Grund:** Strukturelle Mängel – keine Iterationen pro PI, unvollständige SP-Berechnung, kein CD Bund, Gemini-generierter Code ohne klare Architektur.

## 2026-03-27: Context Engineering vor Code
**Entscheidung:** Vollständige AI.md, PRD.md, STATUS.md und Feature-Dateien bevor eine Zeile Code geschrieben wird.
**Grund:** Gemäss Context Engineering Guide – verhindert Context Rot bei langen Sessions.

## 2026-03-27: JSON als Backup-Format
**Entscheidung:** Backup/Restore verwendet versioniertes JSON (nicht CSV).
**Grund:** JSON erhält die komplette Datenstruktur inkl. Iterationen und Allokationen.
**Für Konfigurationsdaten** (Feiertage, Schulferien, Mitarbeiter): weiterhin CSV-Import/Export.

## 2026-03-27: Iterationen als eigenes Objekt
**Entscheidung:** Iterationen werden als eigenes Interface in PIPlanning eingebettet.
**Grund:** Ein PI ohne seine Iterationen ist unvollständig. Atomare Speicherung verhindert inkonsistente Zustände.

## 2026-03-27: Keine externe Datenbank
**Entscheidung:** Alle Daten werden im Frontend-State gehalten und per JSON-File gesichert.
**Grund:** Einfacheres Deployment (nur npm, kein DB-Setup).

## 2026-03-27: Port-Konfiguration
**Entscheidung:** Frontend auf 5173, Backend auf 3001.
**Grund:** Vite-Standard, kein Konflikt mit anderen lokalen Services bei BIT.

## 2026-03-28: FIX-02 – Farbcodes Buchungstypen
**Entscheidung:** Farbcodes gemäss Legende (Screenshot 28.03.2026) korrigiert.
| Typ | Alt | Neu |
|-----|-----|-----|
| FERIEN | #60A5FA Hellblau | #FB923C Orange |
| ABWESEND | #FB923C Orange | #6B7280 Dunkelgrau |
| BETRIEB | #F87171 Rot | #60A5FA Hellblau |
| BETRIEB_PIKETT | #DC2626 Dunkelrot | #7C3AED Violett |
**Datei:** constants.ts

## 2026-03-28: FIX-03 – Legendenbuchstaben in Kalender-Zellen
**Entscheidung:** Gebuchte Zellen zeigen Buchstaben gemäss Legende: F/A/T/M/I/B/BP/P.
**Grund:** Bessere Lesbarkeit bei kleinen Zellen (32px), Farbe allein reicht nicht.
**Datei:** CalendarCell.tsx — ALLOCATION_LETTER Record + content = ALLOCATION_LETTER[allocation]

## 2026-03-27: Blocker vs. Feiertage – Semantik
**Entscheidung:** Blocker/Spezielle Perioden sind KEINE Absenzen.
**Grund:** Ein Freeze-Tag ist ein Arbeitstag – er blockiert Deployments, nicht die Kapazität.
SP-Berechnung: Blocker-Tage zählen als normale Arbeitstage (kein SP-Abzug).

## 2026-03-27: Datenfehler in mitarbeiterstamm.csv – Behandlung
**Entscheidung:** Ungültige Zeilen werden beim Import NICHT stillschweigend korrigiert.
**Verhalten:** Import zeigt Warnung pro fehlerhafter Zeile, betroffene Mitarbeiter werden trotzdem importiert mit Originalwerten, aber in der UI rot markiert.
**Betroffene Zeilen:**
- Jonathan Cattaneo: betrieb=1% + pauschale=100% = 101%
- André Tellenbach: betrieb=1% + pauschale=100% = 101%

## 2026-03-28: Regel – Dokumentation immer nachführen
**Entscheidung:** Installationshandbuch und Benutzerdokumentation müssen bei jeder relevanten Änderung nachgeführt werden.
**Ablageort:** C:\Users\Davide\Documents\AI\safe-pi-planner\docs\

## 2026-03-28: Feature 15 – Multiuser abgeschlossen
**Entscheidung:** Socket.io State-Sync vollständig implementiert.
- Server ist Source of Truth (state-manager.ts, in-memory)
- REST GET /api/state für initialen Load
- Socket.io Events: allocation:change, settings:change, lock:row, unlock:row
- Verbindungsindikator im Header (grün/rot)

## 2026-03-28: FIX-04 – Logo ersetzt durch SVG
**Entscheidung:** bundeslogo.png ersetzt durch Logo_RGB_farbig_negativ.svg
**Grund:** SVG (weisser Text auf transparent) ist auf blauem Header deutlich besser lesbar.
**Quelle:** C:\Users\Davide\Documents\AI\Bundeslogo_SVG\Bundeslogo_SVG\Logo_RGB_farbig_negativ.svg

## 2026-04-01: PI Dashboard Tab – localStorage für SP-Jira-Werte
**Entscheidung:** SP-in-Jira-Werte werden in localStorage gespeichert (Key: `pi-dashboard-sp-jira-v1`).
**Grund:** Kein Server-Sync nötig – lokale Planungsdaten pro User.
**Format:** `{ "${piId}::${iterationId}::${team}": number }`

## 2026-04-01: PI Dashboard Tab – zwei SP-Spalten
**Entscheidung:** Zwei verschiedene SP-Berechnungen nebeneinander:
1. **Berechnet SP** (theoretisch): Betriebstage × SP-Rate ohne tagsgenaue Buchungen
2. **Verfügbar SP Netto** (tagesgenau): aus sp-calculator.ts mit allen Buchungen
**Auslastung Jira %** vergleicht Jira-Commitments gegen tagesgenaue Kapazität (realistischer).

## 2026-03-28: FIX-05 – Header vergrössert
**Änderungen:** Logo h-10→h-14, Titel text-lg→text-xl, Padding py-3→py-4
**Datei:** src/components/layout/Header.tsx

## 2026-04-07: Feature 17 – SP/Tag global statt pro Team
**Entscheidung:** SP/Tag und Std/Jahr sind globale Parameter (GlobalCapacityConfig), nicht pro Team konfigurierbar.
**Grund:** Organisationsweiter Standard ist einheitlich; individuelle Abweichungen werden über FTE-Faktor und Employee.storyPointsPerDay abgebildet.
**Ausnahme:** Employee.storyPointsPerDay bleibt als optionaler Override pro Mitarbeiter erhalten (bestehend).

## 2026-04-07: Feature 17 – Betrieb-Lücke ignoriert WE + gesetzliche Feiertage
**Entscheidung:** Betrieb-Lücken-Erkennung prüft nur Arbeitstage (kein Wochenende, kein gesetzlicher Feiertag).
**Grund:** Betriebsaufgaben fallen am Wochenende und an Feiertagen nicht an. Bei einem Feiertag am Montag übernimmt PIKETT im Störungsfall.
**Pikett:** gilt 7 Tage/Woche, auch Feiertage – immer prüfen.

## 2026-04-07: Feature 17 – piTeamTargets in AppData (nicht localStorage)
**Entscheidung:** SP-Jira-Werte (PO-Eingabe) werden in AppData.piTeamTargets gespeichert, nicht in localStorage.
**Grund:** Konsistenz mit Backup/Restore und Multiuser-State-Sync via Socket.io.
**Abweichung von:** PI Dashboard Tab (Feature PI-Dashboard) der noch localStorage nutzt.
**Migration:** Bestehende localStorage-Werte beim ersten Load in AppData überführen, localStorage dann leeren.
