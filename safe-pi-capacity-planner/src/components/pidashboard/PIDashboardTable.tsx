// PI Dashboard – Tabelle für ein Team in einem PI

import type { PIDashboardTeamData } from '../../hooks/usePIDashboard';
import { PIDashboardIterRow, PIDashboardTotalRow } from './PIDashboardRow';

// Teamfarben konsistent mit Kalender-Legende
const TEAM_COLORS: Record<string, string> = {
  NET: '#003F7F',
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
};

function teamColor(team: string): string {
  return TEAM_COLORS[team] ?? '#6366f1';
}

interface PIDashboardTableProps {
  piId: string;
  teamData: PIDashboardTeamData;
  onSpJiraChange: (piId: string, iterationId: string, team: string, value: number) => void;
}

export default function PIDashboardTable({ piId, teamData, onSpJiraChange }: PIDashboardTableProps) {
  const color = teamColor(teamData.team);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Team-Header */}
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ backgroundColor: color + '12', borderLeft: `4px solid ${color}` }}
      >
        <span className="text-sm font-bold" style={{ color }}>
          Team {teamData.team}
        </span>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left font-semibold">Iteration</th>
              <th className="px-4 py-2.5 text-right font-semibold">Betriebstage</th>
              <th className="px-4 py-2.5 text-right font-semibold">
                SP in Jira
                <span className="ml-1 text-gray-400 normal-case tracking-normal font-normal">(editierbar)</span>
              </th>
              <th className="px-4 py-2.5 text-right font-semibold">Berechnet SP</th>
              <th className="px-4 py-2.5 text-right font-semibold">Verfügbar SP Netto</th>
              <th className="px-4 py-2.5 text-right font-semibold">Delta</th>
              <th className="px-4 py-2.5 text-right font-semibold">Auslastung Jira %</th>
              <th className="px-4 py-2.5 text-right font-semibold">Auslastung App %</th>
            </tr>
          </thead>
          <tbody>
            {teamData.rows.map((row, idx) => (
              <PIDashboardIterRow
                key={row.iterationId}
                row={row}
                isEven={idx % 2 === 0}
                onSpJiraChange={(iterationId, value) =>
                  onSpJiraChange(piId, iterationId, teamData.team, value)
                }
              />
            ))}
            <PIDashboardTotalRow
              totalBetriebstage={teamData.totalBetriebstage}
              totalSpJira={teamData.totalSpJira}
              totalBerechnetSP={teamData.totalBerechnetSP}
              totalVerfuegbarSP={teamData.totalVerfuegbarSP}
              totalDelta={teamData.totalDelta}
              auslastungJiraTotal={teamData.auslastungJiraTotal}
              auslastungAppTotal={teamData.auslastungAppTotal}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
