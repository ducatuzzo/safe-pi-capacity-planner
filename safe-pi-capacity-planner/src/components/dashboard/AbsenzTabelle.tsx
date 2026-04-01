// Absenz-Übersicht: Mitarbeiter | Team | Absenzkategorien | Summenzeile pro Team
import React from 'react';

// Strukturierter Absenz-Datensatz pro Mitarbeiter (berechnet in DashboardView)
export interface AbsenzRow {
  employeeId: string;
  employeeName: string;
  team: string;
  ferienDays: number;
  abwesendDays: number;
  militaerDays: number;
  ipaDays: number;
  betriebDays: number;
  pikettDays: number;
}

interface AbsenzTabelleProps {
  rows: AbsenzRow[];
}

interface TeamSum {
  ferien: number;
  abwesend: number;
  militaer: number;
  ipa: number;
  betrieb: number;
  pikett: number;
}

function sumForTeam(teamRows: AbsenzRow[]): TeamSum {
  return teamRows.reduce(
    (acc, r) => ({
      ferien: acc.ferien + r.ferienDays,
      abwesend: acc.abwesend + r.abwesendDays,
      militaer: acc.militaer + r.militaerDays,
      ipa: acc.ipa + r.ipaDays,
      betrieb: acc.betrieb + r.betriebDays,
      pikett: acc.pikett + r.pikettDays,
    }),
    { ferien: 0, abwesend: 0, militaer: 0, ipa: 0, betrieb: 0, pikett: 0 }
  );
}

export default function AbsenzTabelle({ rows }: AbsenzTabelleProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-24 text-gray-400 text-sm">
        Keine Mitarbeiterdaten verfügbar.
      </div>
    );
  }

  // Nach Team gruppieren (Reihenfolge erhalten)
  const teams = [...new Set(rows.map(r => r.team))].sort();

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-gray-700">Absenz-Übersicht (gefilterter Zeitraum)</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bund-blau text-white text-left">
            <th className="px-4 py-2.5 font-medium">Mitarbeiter</th>
            <th className="px-4 py-2.5 font-medium">Team</th>
            <th className="text-right px-4 py-2.5 font-medium">Ferien</th>
            <th className="text-right px-4 py-2.5 font-medium">Abwesend</th>
            <th className="text-right px-4 py-2.5 font-medium">Militär</th>
            <th className="text-right px-4 py-2.5 font-medium">IPA</th>
            <th className="text-right px-4 py-2.5 font-medium">Betrieb</th>
            <th className="text-right px-4 py-2.5 font-medium">Pikett</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => {
            const teamRows = rows.filter(r => r.team === team);
            const sum = sumForTeam(teamRows);
            return (
              <React.Fragment key={team}>
                {/* Mitarbeiter-Zeilen */}
                {teamRows.map((row, idx) => (
                  <tr
                    key={row.employeeId}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-2 text-gray-800">{row.employeeName}</td>
                    <td className="px-4 py-2 text-gray-500">{row.team}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#60A5FA]">{row.ferienDays || '–'}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#FB923C]">{row.abwesendDays || '–'}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#84CC16]">{row.militaerDays || '–'}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#A78BFA]">{row.ipaDays || '–'}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#F87171]">{row.betriebDays || '–'}</td>
                    <td className="text-right px-4 py-2 tabular-nums text-[#F9A8D4]">{row.pikettDays || '–'}</td>
                  </tr>
                ))}

                {/* Team-Summenzeile */}
                <tr className="border-t border-blue-100 bg-blue-50 text-bund-blau">
                  <td className="px-4 py-2 font-semibold" colSpan={2}>
                    Team {team} – Gesamt
                  </td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.ferien}</td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.abwesend}</td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.militaer}</td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.ipa}</td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.betrieb}</td>
                  <td className="text-right px-4 py-2 font-semibold tabular-nums">{sum.pikett}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
