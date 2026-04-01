# Phase 2: Team-Zielwerte & Multiuser

## Übersicht
Phase 2 baut auf der fertigen MVP-App auf. Zwei separate Features die unabhängig voneinander implementiert werden können.

---

## Feature 14: Team-Zielwerte konfigurierbar

### Ziel
Team-Zielwerte (min. Pikett-Personen, min. Betrieb-Personen, SP/Tag, Stunden/Jahr) sind aktuell hardcoded. Sie sollen in den Einstellungen pro Team konfigurierbar sein.

### Akzeptanzkriterien
- [ ] Settings-Tab: neuer Bereich "Team-Zielwerte" (aktuell "bald"-Platzhalter)
- [ ] Tabelle: Team | Min. Pikett | Min. Betrieb | SP/Tag | Std/Jahr
- [ ] CRUD pro Team-Zeile
- [ ] Default-Werte: Pikett=2, Betrieb=2, SP=1, Std=1600
- [ ] Werte wirken sofort auf Dashboard-Lücken-Erkennung
- [ ] CSV Export/Import

### Technische Details
- Komponente: `src/components/settings/TeamZielwerteSettings.tsx`
- State: `teamZielwerte: TeamZielwerte[]` bereits in App.tsx vorhanden
- Interface `TeamZielwerte` bereits in types.ts vorhanden

### Session-Typ: IMPL (klein)

---

## Feature 15: Multiuser-Fähigkeit

### Ziel
Mehrere Browser-Sessions können gleichzeitig planen. Änderungen eines Users sind sofort bei allen anderen sichtbar. Socket.io ist bereits integriert.

### Akzeptanzkriterien
- [ ] State wird auf dem Server (Express) gehalten, nicht nur im Frontend
- [ ] Bei Verbindung: Client erhält aktuellen State vom Server
- [ ] Änderungen (Allokation, Settings) werden via Socket.io an alle Clients gepusht
- [ ] Einfaches Locking: Anzeige wer gerade eine Zeile bearbeitet ("Davide bearbeitet...")
- [ ] Reconnect-Logik: bei Verbindungsunterbruch automatisch neu verbinden
- [ ] Kein Datenverlust bei kurzem Verbindungsunterbruch

### Technische Details
- Socket.io bereits in server.ts und package.json vorhanden
- Neues Modul: `src/server/state-manager.ts` — hält den globalen State in-memory
- Events: `state:update`, `state:full`, `allocation:change`, `settings:change`
- Frontend: `src/hooks/useSocket.ts` — Hook für Socket.io Verbindung

### Session-Typ: IMPL (komplex — eigene Session)

---

## Reihenfolge
1. FIX-01: Blocker-Header (klein, zuerst)
2. Feature 14: Team-Zielwerte (mittel)
3. Feature 15: Multiuser (komplex, letzte)
