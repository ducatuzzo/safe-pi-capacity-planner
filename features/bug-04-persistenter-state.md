# BUG-04: Persistenter Server-State (JSON-File)

## Status
✅ **Behoben** (Stand: März 2026, verifiziert in STATUS.md)

## Ergebnis
- JSON-File-Persistenz in `server/state-manager.ts` implementiert
- Railway-Deployment für Backend eingerichtet (Platzhalter-URL `https://safe-pi-planner-backend.railway.app` in AI.md)
- `VITE_BACKEND_URL` Environment Variable in Vercel gesetzt
- `data/state.json` in `.gitignore` eingetragen
- CORS erweitert für Vercel-Domain
- Ab Feature 18 (Tenant-Model) wurde die State-Datei zu `state_{tenantId}.json` migriert

## Historische Aufgabenbeschreibung

### Klassifikation
**Bug** (kein neues Feature) — Datenverlust bei Server-Neustart oder Browser-Refresh

### Problem (behoben)
Der `state-manager.ts` hielt den gesamten App-State rein in-memory. Jeder Server-Neustart setzte alle Daten auf SEED-Daten zurück.

### Lösung (umgesetzt)
1. JSON-File-Persistenz im state-manager.ts (lokal + Railway)
2. Backend-Hosting auf Railway (separater Service, Vercel nur für Frontend)
3. Frontend verbindet sich via `VITE_BACKEND_URL` auf Railway

## Nachfolge-Entwicklung
- Feature 18 (Tenant-Model) hat die Architektur erweitert: `state_{tenantId}.json` pro Train
- Siehe feature-18-tenant-model.md und decisions/log.md (10.04.2026)

## Dokumentationsstand
- STATUS.md: BUG-04 als behoben markiert ✅
- AI.md: Deployment-Sektion aktualisiert ✅
- CLAUDE.md: VITE_BACKEND_URL dokumentiert ✅
- docs/deployment_handbuch_v1.0.md: Railway-Setup dokumentiert ✅
