# Installationshandbuch SAFe PI Capacity Planner
**Version:** 1.0
**Stand:** 01.04.2026
**Erstellt für:** BIT – Bundesamt für Informatik und Telekommunikation

---

## 1. Voraussetzungen

| Komponente | Version | Prüfung |
|-----------|---------|---------|
| Node.js | ≥ 20.x (LTS) | `node --version` |
| npm | ≥ 10.x | `npm --version` |
| Browser | Chrome / Edge (aktuell) | — |

---

## 2. Installation

### 2.1 Repository klonen oder entpacken

```bash
git clone https://github.com/ducatuzzo/safe-pi-capacity-planner.git
cd safe-pi-capacity-planner/safe-pi-capacity-planner
```

Oder ZIP entpacken und in den App-Ordner wechseln:
```bash
cd safe-pi-capacity-planner
```

### 2.2 Abhängigkeiten installieren

```bash
npm install
```

> Installiert alle Frontend- und Backend-Pakete (Vite, React, Express, Socket.io, Recharts, jsPDF etc.)

---

## 3. Starten

### Option A: Lokal (Einzelbenutzer)

```bash
npm run dev
```

Öffnet:
- Frontend: http://localhost:5173
- Backend (Socket.io / API): http://localhost:3001

### Option B: Server im LAN (Multiuser)

```bash
# Auf dem Server-Rechner:
npm run dev

# Andere Benutzer im gleichen Netz öffnen:
http://<SERVER-IP>:5173
```

> Vite ist im Dev-Modus mit `host: true` konfiguriert → LAN-Zugriff ohne weitere Konfiguration.

### Option C: Nur Frontend (ohne Backend/Socket.io)

```bash
npm run dev:client
```

> Ohne Backend kein Echtzeit-Sync zwischen Benutzern. Alle Funktionen ausser Multiuser verfügbar.

---

## 4. Ports

| Dienst | Port | Konfiguration |
|--------|------|--------------|
| Vite Frontend | 5173 | `vite.config.ts` |
| Express Backend | 3001 | `server.ts` |

---

## 5. Build (Produktion)

```bash
npm run build
```

Erstellt optimierten Build in `dist/`. Für Deployment auf Server:

```bash
npm run build
# dist/ auf Webserver kopieren (z.B. nginx, IIS)
# Backend separat starten: npx tsx server.ts
```

---

## 6. Verfügbare npm-Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Frontend + Backend gleichzeitig |
| `npm run dev:client` | Nur Vite Frontend |
| `npm run dev:server` | Nur Express Backend |
| `npm run build` | Produktions-Build |
| `npm run lint` | ESLint |

---

## 7. Bekannte Einschränkungen

- **State:** Im Multiuser-Betrieb wird der State im Backend in-memory gehalten. Bei Server-Neustart gehen nicht gesicherte Daten verloren → regelmässig JSON-Backup erstellen.
- **Browser:** Getestet auf Chrome/Edge. Firefox nicht offiziell unterstützt.

## 8. Änderungshistorie

| Version | Datum | Änderung |
|---------|-------|---------|
| 1.0 | 01.04.2026 | Erstveröffentlichung |
| 1.0 (Update) | 07.04.2026 | SP-in-Jira-Werte sind ab v1.3 im Server-State (nicht mehr localStorage). Keine Infrastruktur-Änderung nötig. |
