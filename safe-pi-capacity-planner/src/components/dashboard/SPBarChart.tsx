// SP-Balkendiagramm: Verfügbare SP pro Team pro Iteration (Recharts)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { IterationSPResult } from '../../types';

// Teamfarben konsistent mit Kalender-Legende (Corporate Design Bund)
const TEAM_COLORS: Record<string, string> = {
  NET: '#003F7F',
  ACM: '#0070C0',
  CON: '#00B050',
  PAF: '#FF6600',
};

const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b'];

function getTeamColor(team: string, index: number): string {
  return TEAM_COLORS[team] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

interface SPBarChartProps {
  iterationResults: IterationSPResult[];
  filteredTeams: string[];
}

interface ChartDataRow {
  iterationName: string;
  [team: string]: string | number;
}

export default function SPBarChart({ iterationResults, filteredTeams }: SPBarChartProps) {
  if (iterationResults.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-48 text-gray-400">
        Keine Iterationsdaten verfügbar.
      </div>
    );
  }

  // Alle Teams aus den Resultaten ermitteln (gefiltert falls nötig)
  const allTeams = [
    ...new Set(
      iterationResults.flatMap(r => r.teams.map(t => t.team))
    ),
  ].filter(t => filteredTeams.length === 0 || filteredTeams.includes(t)).sort();

  // Daten für Recharts aufbereiten
  const chartData: ChartDataRow[] = iterationResults.map(iterResult => {
    const row: ChartDataRow = { iterationName: iterResult.iterationName };
    for (const team of allTeams) {
      const teamResult = iterResult.teams.find(t => t.team === team);
      row[team] = teamResult ? Math.round(teamResult.totalAvailableSP * 10) / 10 : 0;
    }
    return row;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Verfügbare Story Points pro Team / Iteration
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="iterationName"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            label={{ value: 'SP', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value} SP`, `Team ${name}`]}
            labelFormatter={(label: string) => `Iteration: ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
          />
          <Legend
            formatter={(value: string) => `Team ${value}`}
            wrapperStyle={{ fontSize: 12 }}
          />
          {allTeams.map((team, idx) => (
            <Bar
              key={team}
              dataKey={team}
              name={team}
              fill={getTeamColor(team, idx)}
              radius={[3, 3, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
