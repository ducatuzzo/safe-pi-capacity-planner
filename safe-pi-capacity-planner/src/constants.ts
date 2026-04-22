import type { AllocationType, FarbConfig } from './types';

// Corporate Design Bund
export const FARBEN = {
  BUND_BLAU: '#003F7F',
  BUND_ROT: '#E63312',
  HINTERGRUND: '#F5F5F5',
  TEXT: '#1A1A1A',
} as const;

// Teamfarben — single source of truth (Feature 23)
// Konsistent mit AI.md; FarbConfig (Feature 16) kann diese Werte zur Laufzeit überschreiben
export const TEAM_COLORS_HEX: Record<string, string> = {
  NET: '#003F7F',  // = FARBEN.BUND_BLAU / primary-700
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
};

export const TEAM_COLORS_FALLBACK: readonly string[] = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

// Farbzuordnung für Buchungstypen (gemäss Legende Screenshot 28.03.2026)
export const BUCHUNGSTYP_FARBEN: Record<AllocationType, string> = {
  NONE: 'transparent',
  FERIEN: '#FB923C',        // Orange
  ABWESEND: '#6B7280',     // Dunkelgrau
  TEILZEIT: '#FDE68A',     // Hellgelb
  MILITAER: '#84CC16',     // Hellgrün
  IPA: '#A78BFA',          // Lila
  BETRIEB: '#60A5FA',      // Hellblau
  BETRIEB_PIKETT: '#7C3AED', // Violett
  PIKETT: '#F9A8D4',       // Rosa
};

// Anzeigebezeichnungen für Buchungstypen (gemäss Legende Screenshot 28.03.2026)
export const BUCHUNGSTYP_LABEL: Record<AllocationType, string> = {
  NONE: 'Keine',
  FERIEN: 'Ferien/Frei',
  ABWESEND: 'Abwesenheit (Arbeitspensum, Sonstiges)',
  TEILZEIT: 'Teilzeit (Halber Tag abwesend)',
  MILITAER: 'Militär',
  IPA: 'IPA',
  BETRIEB: 'Betrieb',
  BETRIEB_PIKETT: 'Betrieb und Pikett',
  PIKETT: 'Pikett',
};

// SP-Faktor pro Buchungstyp (1 = voller Arbeitstag)
export const BUCHUNGSTYP_SP_FAKTOR: Record<AllocationType, number> = {
  NONE: 1,
  FERIEN: 0,
  ABWESEND: 0,
  TEILZEIT: 0.5,
  MILITAER: 0,
  IPA: 0,
  BETRIEB: 1,       // Betrieb zählt als Arbeitstag, wird aber separat abgezogen
  BETRIEB_PIKETT: 1,
  PIKETT: 1,
};

// Standard-Werte
export const DEFAULTS = {
  STORY_POINTS_PER_DAY: 1,
  STANDARDSTUNDEN_PRO_JAHR: 1600,
  FTE: 1.0,
  CAPACITY_PERCENT: 100,
  BETRIEB_PERCENT: 0,
  PAUSCHAL_PERCENT: 0,
} as const;

// Farben für Spezialzustände im Kalender
export const KALENDER_FARBEN = {
  FEIERTAG: '#D1D5DB',
  SCHULFERIEN: '#E5E7EB',
  BLOCKER: '#BFDBFE',
  HEUTE_FARBE: '#E63312',
  WOCHENENDE: '#F3F4F6',
} as const;

// Schneeflocke für Change-Freeze
export const CHANGE_FREEZE_SYMBOL = '❄️';

// API-Basispfad
export const API_BASE = '/api';

// Standard-Farbkonfiguration (entspricht den bisherigen Tailwind-Farben)
export const DEFAULT_FARB_CONFIG: FarbConfig = {
  buchungstypen: {
    NONE:           { bg: 'transparent', text: '#1A1A1A' },
    FERIEN:         { bg: '#FB923C', text: '#FFFFFF' },
    ABWESEND:       { bg: '#6B7280', text: '#FFFFFF' },
    TEILZEIT:       { bg: '#FDE68A', text: '#1A1A1A' },
    MILITAER:       { bg: '#84CC16', text: '#FFFFFF' },
    IPA:            { bg: '#A78BFA', text: '#FFFFFF' },
    BETRIEB:        { bg: '#60A5FA', text: '#FFFFFF' },
    BETRIEB_PIKETT: { bg: '#7C3AED', text: '#FFFFFF' },
    PIKETT:         { bg: '#F9A8D4', text: '#1A1A1A' },
  },
  kalender: {
    feiertag:   { bg: '#D1D5DB', text: '#6B7280' },
    schulferien: { bg: '#E5E7EB', text: '#6B7280' },
    blocker:    { bg: '#BFDBFE', text: '#4B5563' },
    wochenende: { bg: '#F3F4F6', text: '#9CA3AF' },
    heute:      { text: '#E63312', bold: true },
  },
};
