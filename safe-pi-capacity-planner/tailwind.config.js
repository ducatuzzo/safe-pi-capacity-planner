/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Corporate Design Bund
        'bund-blau': '#003F7F',
        'bund-rot': '#E63312',
        'bund-bg': '#F5F5F5',
        'bund-text': '#1A1A1A',
        // Buchungstypen
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
        sans: ['Frutiger', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
