// PI Dashboard – Hauptansicht: pro PI eine Sektion mit Team-Tabellen

import type { Employee, AppData, PIPlanning, FilterState } from '../../types';
import { usePIDashboard } from '../../hooks/usePIDashboard';
import PIDashboardTable from './PIDashboardTable';

interface PIDashboardViewProps {
  employees: Employee[];
  pis: PIPlanning[];
  appData: AppData;
  filterState: FilterState;
}

export default function PIDashboardView({
  employees,
  pis,
  appData,
  filterState,
}: PIDashboardViewProps) {
  const { data, setSpJira } = usePIDashboard(employees, pis, appData, filterState);

  if (pis.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Keine PIs definiert. Bitte zuerst PI-Planung unter Einstellungen erfassen.
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Keine Mitarbeiter erfasst. Bitte zuerst Mitarbeiter unter Einstellungen erfassen.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Keine Daten für den gewählten Filter.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 border border-gray-200 rounded-lg px-4 py-3 bg-white">
        <span className="font-semibold text-gray-600">Auslastung:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-400" />
          {'< 85 % – gut'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
          {'85–100 % – Achtung'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
          {'> 100 % – Überlastet'}
        </span>
        <span className="ml-auto italic text-gray-400">
          «SP in Jira» – Klicken zum Bearbeiten, Wert wird lokal gespeichert.
        </span>
      </div>

      {/* Pro PI eine Sektion */}
      {data.map(({ pi, teams }) => (
        <section key={pi.id}>
          {/* PI-Header */}
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-base font-bold text-bund-blau">{pi.name}</h2>
            <span className="text-xs text-gray-400">
              {pi.startStr} – {pi.endStr}
            </span>
          </div>

          {/* Team-Tabellen */}
          <div className="space-y-4">
            {teams.length === 0 ? (
              <p className="text-sm text-gray-400">
                Keine Teams im gewählten Filter.
              </p>
            ) : (
              teams.map(teamData => (
                <PIDashboardTable
                  key={teamData.team}
                  piId={pi.id}
                  teamData={teamData}
                  onSpJiraChange={setSpJira}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
