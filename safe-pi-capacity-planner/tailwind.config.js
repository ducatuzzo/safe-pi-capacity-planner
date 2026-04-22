/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // === BIT Skin: Swiss DS CSS-Variable-Architektur ===
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',  // = Bundesblau #003F7F
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          50:  'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',  // = Bundesrot #E63312
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
        },

        // === Rückwärtskompatible Aliase (NICHT LÖSCHEN — noch in Gebrauch) ===
        'bund-blau': '#003F7F',   // Alias für primary-700
        'bund-rot':  '#E63312',   // Alias für secondary-500
        'bund-bg':   '#F5F5F5',
        'bund-text': '#1A1A1A',

        // === Teamfarben (named tokens für statische Verwendung) ===
        'team-net': '#003F7F',
        'team-acm': '#0070C0',
        'team-con': '#00B050',
        'team-paf': '#FF6600',

        // === Buchungstypen (Feature 16 — NICHT ÄNDERN) ===
        buchung: {
          ferien: '#60A5FA',
          abwesend: '#FB923C',
          teilzeit: '#FDE68A',
          militaer: '#84CC16',
          ipa: '#A78BFA',
          betrieb: '#F87171',
          betriebPikett: '#DC2626',
          pikett: '#F9A8D4',
          feiertag: '#D1D5DB',
          schulferien: '#E5E7EB',
          blocker: '#BFDBFE',
        },
      },
      fontFamily: {
        sans: ['Frutiger', 'NotoSans', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
