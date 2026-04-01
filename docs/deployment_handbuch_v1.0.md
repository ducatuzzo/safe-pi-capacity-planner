# Deployment-Handbuch SAFe PI Capacity Planner
**Version:** 1.0
**Stand:** 01.04.2026
**Erstellt für:** BIT – Bundesamt für Informatik und Telekommunikation

---

## 1. Übersicht Deployment-Optionen

| Option | Eignung | Aufwand |
|--------|---------|---------|
| **A – Lokal** | Einzelbenutzer, schneller Einstieg | Minimal |
| **B – LAN-Server** | Team im gleichen Netz, Multiuser | Gering |
| **C – Vercel (Cloud)** | Einfaches Cloud-Deployment, Frontend | Minimal |

---

## 2. Option A – Lokales Deployment

Für Einzelbenutzer oder Tests.

```bash
cd safe-pi-capacity-planner
npm install
npm run dev
```

Zugriff: http://localhost:5173

**Einschränkungen:**
- Kein Echtzeit-Sync mit anderen Benutzern
- State geht bei Browser-Refresh ohne Backend verloren

---

## 3. Option B – LAN-Server

Empfohlen für Teamnutzung im BIT-Netz.

### Voraussetzungen
- Dedizierter Rechner/VM mit Node.js ≥ 20 im gleichen LAN
- Firewall: Ports 5173 und 3001 offen für LAN

### Schritte

```bash
# 1. Code auf Server kopieren/klonen
git clone https://github.com/ducatuzzo/safe-pi-capacity-planner.git
cd safe-pi-capacity-planner/safe-pi-capacity-planner

# 2. Abhängigkeiten installieren
npm install

# 3. Starten (im Hintergrund mit pm2 oder screen)
npm run dev

# oder mit pm2:
npm install -g pm2
pm2 start "npm run dev" --name safe-pi-planner
pm2 save
pm2 startup
```

### Zugriff für Team-Mitglieder
```
http://<SERVER-IP>:5173
```

### Multiuser-Funktionen
- Echtzeit-Sync via Socket.io (Port 3001)
- Row-Locking: Beim Drag wird die Zeile für andere Benutzer gesperrt
- Verbindungsindikator im Header (grün = verbunden)

---

## 4. Option C – Vercel (Cloud, Frontend only)

Für schnelles Cloud-Deployment des Frontends.

```bash
# Vercel CLI
npm install -g vercel
cd safe-pi-capacity-planner
vercel

# oder via GitHub-Integration:
# 1. Repo auf GitHub pushen
# 2. vercel.com → New Project → GitHub-Repo auswählen
# 3. Root Directory: safe-pi-capacity-planner
# 4. Build Command: npm run build
# 5. Output Directory: dist
```

**Einschränkungen bei Vercel:**
- Backend (Socket.io) läuft nicht auf Vercel (Serverless)
- Kein Echtzeit-Sync zwischen Benutzern
- SP-in-Jira-Werte (PI Dashboard) nur lokal im Browser

---

## 5. State-Persistenz

### Problem
Der Backend-State (Buchungen, Einstellungen) wird in-memory gehalten. Bei Server-Neustart gehen Daten verloren.

### Lösung
Regelmässige JSON-Backups über die App-UI:
1. Tab **Einstellungen** → **Backup & Restore**
2. **Export** → JSON-Datei herunterladen
3. JSON-Datei sicher aufbewahren (z.B. SharePoint, lokales Netzlaufwerk)
4. Bei Bedarf: **Import** → JSON-Datei hochladen

### Automatisierung (Optional)
```bash
# Backup via API (POST /api/state gibt aktuellen State zurück):
curl http://localhost:3001/api/state > backup-$(date +%Y%m%d).json
```

---

## 6. PI Dashboard – localStorage

Der PI Dashboard Tab speichert SP-in-Jira-Werte **lokal im Browser** (nicht auf dem Server).

- **Key:** `pi-dashboard-sp-jira-v1`
- **Scope:** Gerätespezifisch – nicht zwischen Benutzern synchronisiert
- **Verlust:** Bei Browser-Cache-Löschung gehen Werte verloren
- **Empfehlung:** Werte zusätzlich in einem gemeinsamen Dokument (Excel, Confluence) festhalten

---

## 7. Update-Prozess

```bash
# Neue Version holen
git pull origin master

# Abhängigkeiten aktualisieren (falls package.json geändert)
npm install

# App neu starten
pm2 restart safe-pi-planner
# oder
npm run dev
```

---

## 8. Troubleshooting

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Port 5173 belegt | Anderer Vite-Prozess läuft | `npx kill-port 5173` oder anderen Port in `vite.config.ts` setzen |
| Port 3001 belegt | Anderer Prozess | `npx kill-port 3001` |
| Verbindungsindikator rot | Backend nicht gestartet | `npm run dev:server` separat starten |
| SP-in-Jira-Werte weg | Browser-Cache geleert | Werte erneut erfassen; zukünftig als Backup anlegen |
| State nach Neustart weg | In-memory Backend | JSON-Backup importieren (Einstellungen → Restore) |
