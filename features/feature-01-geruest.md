# Feature 01: Projektgerüst

## Ziel
Sauberes, lauffähiges Projektgerüst für den SAFe PI Capacity Planner aufsetzen. Nach diesem Feature läuft `npm run dev` ohne Fehler und zeigt eine leere Shell mit CD-Bund-Header.

## Akzeptanzkriterien
- [ ] Verzeichnis `safe-pi-capacity-planner/` mit korrekter Ordnerstruktur
- [ ] `package.json` mit allen Dependencies aus AI.md
- [ ] `vite.config.ts` konfiguriert
- [ ] `tailwind.config.js` mit Bund-Farben konfiguriert
- [ ] `server.ts` (Express + Socket.io) läuft auf Port 3001
- [ ] `index.html` mit Frutiger/Arial Font
- [ ] `App.tsx` mit 3 Tabs: Planung | Kapazität | Settings
- [ ] Header zeigt Bundeslogo + Titel "SAFe PI Capacity Planner"
- [ ] `npm run dev` startet ohne Fehler

## Technische Details
- Port Frontend: 5173 (Vite default)
- Port Backend: 3001 (Express)
- Proxy: Vite leitet /api/* an localhost:3001 weiter
- Socket.io auf Port 3001

## Ordnerstruktur
```
safe-pi-capacity-planner/
├── src/
│   ├── components/
│   │   ├── layout/        # Header, Sidebar, TabNav
│   │   ├── calendar/      # Kalender-Komponenten
│   │   ├── settings/      # Settings-Formulare
│   │   └── dashboard/     # Dashboard-Charts
│   ├── utils/             # SP-Berechnung, Datum-Helpers
│   ├── types.ts           # Alle Interfaces
│   ├── constants.ts       # Farben, Default-Werte
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── server.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── index.html
```

## Status
- [x] Design: abgeschlossen
- [x] Implementierung: abgeschlossen (27.03.2026)
- [ ] Tests: offen

## Session-Typ: IMPL
