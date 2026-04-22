// PI Dashboard – Hauptansicht: pro PI eine Sektion mit Team-Tabellen

import { useState, useMemo } from 'react';
import { Download, FileImage } from 'lucide-react';
import type { Employee, AppData, PIPlanning, FilterState, PITeamTarget } from '../../types';
import { usePIDashboard } from '../../hooks/usePIDashboard';
import { exportToPDF, exportToPNG } from '../../utils/export-utils';
import bundeslogo from '../../assets/bundeslogo.png';
import PIDashboardTable from './PIDashboardTable';

interface PIDashboardViewProps {
  employees: Employee[];
  pis: PIPlanning[];
  appData: AppData;
  filterState: FilterState;
  onPiTeamTargetsChange: (targets: PITeamTarget[]) => void;
}

/** Lesbarer Filter-Label für den Export-Kopf */
function buildFilterLabel(filterState: FilterState, pis: PIPlanning[]): string {
  const parts: string[] = [];
  if (filterState.teams.length > 0) parts.push(`Team: ${filterState.teams.join(', ')}`);
  if (filterState.piId) {
    const pi = pis.find(p => p.id === filterState.piId);
    if (pi) parts.push(`PI: ${pi.name}`);
  }
  if (filterState.iterationId) {
    for (const pi of pis) {
      const iter = pi.iterationen.find(i => i.id === filterState.iterationId);
      if (iter) { parts.push(`Iteration: ${iter.name}`); break; }
    }
  }
  if (filterState.year) parts.push(`Jahr: ${filterState.year}`);
  if (filterState.dateFrom && filterState.dateTo) parts.push(`${filterState.dateFrom} – ${filterState.dateTo}`);
  return parts.length > 0 ? parts.join(' | ') : 'Alle Daten';
}

export default function PIDashboardView({
  employees,
  pis,
  appData,
  filterState,
  onPiTeamTargetsChange,
}: PIDashboardViewProps) {
  const [exportLoading, setExportLoading] = useState<'pdf' | 'png' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // SP Jira setzen: bestehenden Eintrag updaten oder neuen anlegen
  function handleSetSpJira(piId: string, iterationId: string, team: string, value: number) {
    const existing = appData.piTeamTargets;
    const idx = existing.findIndex(
      t => t.piId === piId && t.iterationId === iterationId && t.teamName === team,
    );
    let updated: PITeamTarget[];
    if (idx >= 0) {
      updated = existing.map((t, i) => i === idx ? { ...t, spJira: value } : t);
    } else {
      updated = [...existing, { piId, iterationId, teamName: team, spJira: value }];
    }
    onPiTeamTargetsChange(updated);
  }

  const { data, setSpJira } = usePIDashboard(employees, pis, appData, filterState, handleSetSpJira);

  const filterLabel = useMemo(() => buildFilterLabel(filterState, pis), [filterState, pis]);
  const today = new Date().toISOString().split('T')[0];

  async function handleExportPDF() {
    setExportError(null);
    setExportLoading('pdf');
    try {
      await exportToPDF('pi-export-container', `safe-pi-dashboard_${today}.pdf`);
    } catch (e) {
      console.error('PDF-Export fehlgeschlagen:', e);
      setExportError('PDF-Export fehlgeschlagen.');
    } finally {
      setExportLoading(null);
    }
  }

  async function handleExportPNG() {
    setExportError(null);
    setExportLoading('png');
    try {
      await exportToPNG('pi-export-container', `safe-pi-dashboard_${today}.png`);
    } catch (e) {
      console.error('PNG-Export fehlgeschlagen:', e);
      setExportError('PNG-Export fehlgeschlagen.');
    } finally {
      setExportLoading(null);
    }
  }

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
    <div className="space-y-4">
      {/* Export-Buttons */}
      <div className="flex items-center justify-end gap-2">
        {exportError && (
          <span className="text-xs text-red-600 mr-2">{exportError}</span>
        )}
        <button
          onClick={handleExportPDF}
          disabled={exportLoading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-700 text-white text-sm rounded hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={15} />
          {exportLoading === 'pdf' ? 'Exportiere…' : 'PDF'}
        </button>
        <button
          onClick={handleExportPNG}
          disabled={exportLoading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-700 text-white text-sm rounded hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileImage size={15} />
          {exportLoading === 'png' ? 'Exportiere…' : 'PNG'}
        </button>
      </div>

      {/* Export-Container: dieser Bereich wird als PDF/PNG exportiert */}
      <div id="pi-export-container" className="space-y-10 bg-white p-4 rounded-lg">
        {/* Export-Kopfzeile: Logo + Filter-Info */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <img src={bundeslogo} alt="Schweizerische Eidgenossenschaft" className="h-10" />
          <div className="text-right">
            <div className="text-sm font-semibold text-primary-700">SAFe PI Capacity Planner – PI Dashboard</div>
            <div className="text-xs text-gray-500">{filterLabel}</div>
          </div>
        </div>

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
          <span className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-200">
            <span>✅ Delta &gt; 0 – Puffer</span>
            <span>ℹ️ Delta = 0 – Exakt</span>
            <span>⚠️ Delta &lt; 0 – Überbucht</span>
          </span>
          <span className="ml-auto italic text-gray-400">
            «SP in Jira» – Klicken zum Bearbeiten, Wert wird synchronisiert.
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
    </div>
  );
}
