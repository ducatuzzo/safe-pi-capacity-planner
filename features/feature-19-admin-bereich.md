# Feature 19: Admin-Bereich mit Code-Isolation (Mandatenfähigkeit — Phase 2)

## Ziel
Ein geschützter Admin-Bereich innerhalb der App erlaubt mächtige Operationen (State-Reset, Tenant-Verwaltung). Zugang über Admin-Code (6-stellig, alphanumerisch). Baut auf Feature 18 (Tenant-Model) auf.

## Status
🔲 Geplant — abhängig von Feature 18

## Abhängigkeiten
- Feature 18 (Tenant-Model) — Admin-Code und Tenant-Registry existieren bereits

---

## Admin-Funktionen (geschützt)

| Funktion | Beschreibung | Wer braucht es |
|---|---|---|
| State-Reset | Alle Daten des Tenants löschen → Leerzustand | Admin beim Neustart PI |
| Backup importieren | Vollständiger State-Import (bereits offen, hier unter Admin verschieben) | Admin |
| Tenant anlegen | Neuen Train mit Name + Admin-Code erstellen | Admin |
| Tenant-Name ändern | Anzeigename des Trains ändern | Admin |
| Admin-Code ändern | Neuen Code setzen (alter Code als Verifikation) | Admin |

---

## Backend-Erweiterungen (server.ts)

### Neuer Endpoint: `POST /api/tenants/:tenantId/reset`
```
Body: { adminCode: string }
Aktion: Tenant-State auf leeren Initial-State zurücksetzen
Response: { ok: true } oder 401 Unauthorized
```

### Neuer Endpoint: `PATCH /api/tenants/:tenantId`
```
Body: { adminCode: string, name?: string, newAdminCode?: string }
Aktion: Tenant-Name oder Admin-Code ändern
Response: { ok: true } oder 401
```

### Validierungsprinzip (kein Session-Konzept in Phase 1)
- Jede Admin-Operation schickt den `adminCode` im Request-Body
- Server verifiziert per `bcryptjs.compare(code, hash)` → 401 bei Fehler
- Kein Token, kein Cookie, kein Session-Store
- Nach 3 Fehlversuchen: 60 Sekunden Rate-Limit (in-memory, Map pro tenantId)

---

## Frontend-Änderungen

### Neue Datei: `src/components/admin/AdminGate.tsx`
Modal mit Code-Eingabe (6 Felder, OTP-Style). Erscheint bevor Admin-Aktionen ausgeführt werden.

**UI:**
- Titel "Admin-Zugang"
- 6 einzelne Input-Felder (Tab-/Pfeil-Navigation automatisch)
- "Bestätigen"-Button
- Fehlermeldung bei falschem Code
- Schliessen-Button / ESC

**Logik:**
- Code wird an den aufrufenden Callback übergeben
- AdminGate merkt sich den Code für 15 Minuten in `sessionStorage['pi-planner-admin-code']`
  → Wiederholte Admin-Aktionen brauchen keine erneute Eingabe
- Nach 15 Minuten oder bei Tab-Schliessen: Code gelöscht

### Neue Datei: `src/components/admin/AdminView.tsx`
Eigene Seite (neuer Tab in der Navigation) — nur sichtbar nach Code-Eingabe.

**Sektionen:**

#### 1. Tenant-Übersicht
- Anzeige: Tenant-ID, Tenant-Name, Erstellungsdatum
- Bearbeiten-Button: öffnet Modal → neuer Name, bestätigt mit Admin-Code

#### 2. Gefährliche Aktionen (rot umrahmt)
- **"Alle Daten löschen"**: Bestätigungsdialog "Tippen Sie LÖSCHEN zur Bestätigung" + Admin-Code-Eingabe → ruft `POST /api/tenants/:id/reset`
- **"Backup importieren"**: wie bisheriger Import, aber hier platziert (aus Einstellungen entfernen oder Duplikat lassen)
- **"Admin-Code ändern"**: alter Code + neuer Code (2×) → ruft `PATCH /api/tenants/:id`

#### 3. Andere Trains (nur Anzeige)
- Liste aller Tenants (ohne fremde Daten zu zeigen)
- "Neuen Train anlegen"-Button → öffnet Modal (Name + Admin-Code setzen)

### Geänderte Datei: `src/components/layout/TabNav.tsx`
- Neuer Tab `admin` mit Shield-Icon (Lucide `Shield`)
- Tab erscheint immer, Zugang aber erst nach Code-Eingabe
- Beim Klick: Falls kein Admin-Code in sessionStorage → AdminGate öffnen → dann zu AdminView weiterleiten

### Geänderte Datei: `src/types.ts`
```typescript
export type ActiveTab = 'planung' | 'kapazitaet' | 'dashboard' | 'pidashboard' | 'settings' | 'admin';
```

### Geänderte Datei: `App.tsx`
- `activeTab === 'admin'` → `<AdminView />` rendern
- Admin-Code aus sessionStorage lesen und an AdminView übergeben

---

## Sicherheitsniveau (Phase 1 — ehrliche Einschätzung)

| Eigenschaft | Status |
|---|---|
| Daten-Isolation pro Tenant | ✅ echte Isolation (getrennte JSON-Files) |
| Admin-Code-Schutz serverseitig | ✅ bcryptjs-Hash, kein Plaintext |
| Rate-Limiting bei Fehlversuchen | ✅ in-memory, 3 Versuche dann 60s |
| Session-Sicherheit | ⚠️ Code im sessionStorage — kein echter Token |
| Netzwerk-Sicherheit | ⚠️ HTTPS via Vercel/Railway — ausreichend |
| Multi-Faktor | ❌ kein echter 2FA — kommt in Phase 3 (TOTP) |
| Audit-Log | ❌ kein Log — kommt in Phase 3 |

Für interne Präsentations- und Pilotnutzung ausreichend.
Für produktiven Betrieb mit sensiblen Daten: TOTP (Feature 20) implementieren.

---

## Backup / Restore - Anpassung

Der bisherige Backup-Import in `BackupRestoreSettings.tsx` bleibt zugänglich (kein Breaking Change). Zusätzlich ist Import auch in der Admin-Seite verfügbar. Der Export bleibt offen (keine Einschränkung).

---

## Akzeptanzkriterien

- [ ] Admin-Tab erscheint in der Navigation mit Shield-Icon
- [ ] Klick auf Admin-Tab → AdminGate-Modal mit 6-stelliger Code-Eingabe
- [ ] Falscher Code → Fehlermeldung, max. 3 Versuche dann gesperrt (60s)
- [ ] Richtiger Code → AdminView öffnet sich
- [ ] Innerhalb 15 Minuten: kein erneuter Code-Dialog
- [ ] "Alle Daten löschen": Bestätigung + Code → State wird resettet, alle Clients bekommen leeren State via Socket
- [ ] "Admin-Code ändern": alter + neuer Code → Code wird serverseitig geändert
- [ ] "Neuen Train anlegen": Name + Code setzen → Tenant in Registry, per TenantGate wählbar
- [ ] TypeScript: kein Compilerfehler

---

## Nicht in diesem Feature (kommt in Feature 20)

- TOTP / Google Authenticator / Microsoft Authenticator
- aGov OIDC-Integration
- Audit-Log (wer hat wann was geändert)
- Tenant-Löschen (mit Datenverlust-Warnung)
- Rollen (Admin, Planer, Read-Only)
