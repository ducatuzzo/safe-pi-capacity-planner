// Lücken-Erkennung: Pikett- und Betrieb-Unterbesetzung kompakt als Liste
import { CheckCircle } from 'lucide-react';
import type { TeamSPResult } from '../../types';

interface LueckenListeProps {
  teamResults: TeamSPResult[];
}

// ISO-Kalenderwoche berechnen
function getISOWeek(dateStr: string): { week: number; year: number } {
  const d = new Date(dateStr + 'T12:00:00Z');
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

function groupByWeek(dates: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const d of dates) {
    const { week, year } = getISOWeek(d);
    const key = `${year}-KW${String(week).padStart(2, '0')}`;
    const existing = result.get(key) ?? [];
    existing.push(d);
    result.set(key, existing);
  }
  return result;
}

interface LueckeEintrag {
  weekKey: string;
  team: string;
  typ: 'pikett' | 'betrieb';
  anzahlTage: number;
}

export default function LueckenListe({ teamResults }: LueckenListeProps) {
  // Alle Lücken sammeln und nach KW gruppieren
  const eintraege: LueckeEintrag[] = [];

  for (const teamResult of teamResults) {
    if (teamResult.pikettGaps.length > 0) {
      const byWeek = groupByWeek(teamResult.pikettGaps);
      for (const [weekKey, days] of byWeek) {
        eintraege.push({ weekKey, team: teamResult.team, typ: 'pikett', anzahlTage: days.length });
      }
    }
    if (teamResult.betriebGaps.length > 0) {
      const byWeek = groupByWeek(teamResult.betriebGaps);
      for (const [weekKey, days] of byWeek) {
        eintraege.push({ weekKey, team: teamResult.team, typ: 'betrieb', anzahlTage: days.length });
      }
    }
  }

  // Nach KW sortieren
  eintraege.sort((a, b) => a.weekKey.localeCompare(b.weekKey) || a.team.localeCompare(b.team));

  const totalPikettDays = teamResults.reduce((sum, t) => sum + t.pikettGaps.length, 0);
  const totalBetriebDays = teamResults.reduce((sum, t) => sum + t.betriebGaps.length, 0);
  const keineluecken = totalPikettDays === 0 && totalBetriebDays === 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Lücken-Erkennung</h3>

      {keineluecken ? (
        <div className="flex items-center gap-2 text-green-600 font-medium py-2">
          <CheckCircle size={18} />
          <span>Keine Lücken im gewählten Zeitraum</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {eintraege.map((e, idx) => {
            const kw = e.weekKey.replace(/^\d{4}-/, '');
            if (e.typ === 'pikett') {
              return (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded bg-red-50 border border-red-100"
                >
                  <span className="w-16 font-mono text-gray-500 text-xs">{kw}</span>
                  <span className="font-medium text-red-600">Pikett-Lücke</span>
                  <span className="text-gray-500">–</span>
                  <span className="text-gray-700">Team {e.team}</span>
                  <span className="ml-auto text-red-500 text-xs font-semibold tabular-nums">
                    {e.anzahlTage} {e.anzahlTage === 1 ? 'Tag' : 'Tage'}
                  </span>
                </li>
              );
            }
            return (
              <li
                key={idx}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded bg-orange-50 border border-orange-100"
              >
                <span className="w-16 font-mono text-gray-500 text-xs">{kw}</span>
                <span className="font-medium text-orange-600">Betrieb-Unterbesetzung</span>
                <span className="text-gray-500">–</span>
                <span className="text-gray-700">Team {e.team}</span>
                <span className="ml-auto text-orange-500 text-xs font-semibold tabular-nums">
                  {e.anzahlTage} {e.anzahlTage === 1 ? 'Tag' : 'Tage'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Zusammenfassung wenn Lücken vorhanden */}
      {!keineluecken && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
          {totalPikettDays > 0 && (
            <span className="text-red-500 font-medium">{totalPikettDays} Pikett-Lückentage total</span>
          )}
          {totalBetriebDays > 0 && (
            <span className="text-orange-500 font-medium">{totalBetriebDays} Betrieb-Lückentage total</span>
          )}
        </div>
      )}
    </div>
  );
}
