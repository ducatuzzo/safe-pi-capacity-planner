// Team-Konfiguration: Mindestbesetzung + Kapazitätsparameter pro Team
// Einzige Quelle der Wahrheit – ersetzt die ehemaligen Team-Zielwerte.

import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import type { Employee, TeamConfig } from '../../types';

interface Props {
  employees: Employee[];
  teamConfigs: TeamConfig[];
  onChange: (configs: TeamConfig[]) => void;
}

function deriveTeams(employees: Employee[]): string[] {
  return [...new Set(employees.map(e => e.team).filter(Boolean))].sort();
}

function getConfig(configs: TeamConfig[], teamName: string): TeamConfig {
  return (
    configs.find(c => c.teamName === teamName) ?? {
      teamName,
      minPikett: 0,
      minBetrieb: 1,
      storyPointsPerDay: 1,
      hoursPerYear: 1600,
    }
  );
}

function parseIntSafe(val: string, fallback: number): number {
  const n = parseInt(val, 10);
  return isNaN(n) || n < 0 ? fallback : n;
}

function parseFloatSafe(val: string, fallback: number): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? fallback : n;
}

export default function TeamConfigSettings({ employees, teamConfigs, onChange }: Props) {
  const teams = deriveTeams(employees);
  const [editDraft, setEditDraft] = useState<Record<string, TeamConfig>>({});
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getDraft(teamName: string): TeamConfig {
    return editDraft[teamName] ?? getConfig(teamConfigs, teamName);
  }

  function setDraftField(
    teamName: string,
    field: keyof Omit<TeamConfig, 'teamName'>,
    raw: string,
  ) {
    const current = getDraft(teamName);
    let value: number;
    if (field === 'storyPointsPerDay') {
      value = parseFloatSafe(raw, 1);
    } else if (field === 'hoursPerYear') {
      value = parseIntSafe(raw, 1600);
    } else {
      value = parseIntSafe(raw, 0);
    }
    setEditDraft(prev => ({
      ...prev,
      [teamName]: { ...current, [field]: value },
    }));
  }

  function saveSingle(teamName: string) {
    const draft = getDraft(teamName);
    const updated = teamConfigs.filter(c => c.teamName !== teamName);
    updated.push(draft);
    for (const t of teams) {
      if (!updated.some(c => c.teamName === t)) {
        updated.push(getConfig(teamConfigs, t));
      }
    }
    onChange(updated.sort((a, b) => a.teamName.localeCompare(b.teamName)));
    setEditDraft(prev => {
      const next = { ...prev };
      delete next[teamName];
      return next;
    });
    setErfolg(`Team ${teamName} gespeichert.`);
    setTimeout(() => setErfolg(null), 2000);
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────
  function handleExport() {
    const header = 'teamName;minPikett;minBetrieb;storyPointsPerDay;hoursPerYear';
    const rows = teams.map(t => {
      const c = getDraft(t);
      return `${c.teamName};${c.minPikett};${c.minBetrieb};${c.storyPointsPerDay};${c.hoursPerYear}`;
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'team_config.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── CSV Import ───────────────────────────────────────────────────────────
  function handleImportClick() {
    setFehler(null);
    setErfolg(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result;
        if (typeof text !== 'string') {
          setFehler('Datei konnte nicht gelesen werden.');
          return;
        }

        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) {
          setFehler('CSV enthält keine Datenzeilen.');
          return;
        }

        const header = lines[0].split(';').map(h => h.trim());
        const iTeam = header.indexOf('teamName');
        const iPikett = header.indexOf('minPikett');
        const iBetrieb = header.indexOf('minBetrieb');
        const iSP = header.indexOf('storyPointsPerDay');
        const iHours = header.indexOf('hoursPerYear');

        if (iTeam < 0 || iPikett < 0 || iBetrieb < 0) {
          setFehler('CSV-Header ungültig. Mindestens: teamName;minPikett;minBetrieb');
          return;
        }

        const imported: TeamConfig[] = [];
        const warnings: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(';').map(c => c.trim());
          const teamName = cols[iTeam];
          const minPikett = parseIntSafe(cols[iPikett], 0);
          const minBetrieb = parseIntSafe(cols[iBetrieb], 0);
          const storyPointsPerDay = iSP >= 0 ? parseFloatSafe(cols[iSP], 1) : 1;
          const hoursPerYear = iHours >= 0 ? parseIntSafe(cols[iHours], 1600) : 1600;

          if (!teamName) {
            setFehler(`Zeile ${i + 1}: teamName darf nicht leer sein.`);
            return;
          }

          if (!teams.includes(teamName)) warnings.push(teamName);
          imported.push({ teamName, minPikett, minBetrieb, storyPointsPerDay, hoursPerYear });
        }

        const merged = [...imported];
        for (const t of teams) {
          if (!merged.some(c => c.teamName === t)) {
            merged.push(getConfig(teamConfigs, t));
          }
        }
        onChange(merged.sort((a, b) => a.teamName.localeCompare(b.teamName)));

        let msg = `${imported.length} Team(s) importiert.`;
        if (warnings.length > 0) {
          msg += ` Hinweis: Nicht im Mitarbeiterstamm: ${warnings.join(', ')}.`;
        }
        setErfolg(msg);
        setFehler(null);
      } catch {
        setFehler('Fehler beim Lesen der CSV-Datei.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Team-Konfiguration</h2>
      <p className="text-sm text-gray-500 mb-4">
        Mindestbesetzung und Kapazitätsparameter pro Team. Teamnamen werden automatisch aus dem
        Mitarbeiterstamm abgeleitet.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
        >
          <Download size={14} /> CSV exportieren
        </button>
        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
        >
          <Upload size={14} /> CSV importieren
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>

      {fehler && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {fehler}
        </div>
      )}
      {erfolg && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {erfolg}
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-gray-400">
          Keine Teams vorhanden. Bitte zuerst Mitarbeiter unter «Mitarbeiter» erfassen.
        </p>
      ) : (
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left font-semibold">Team</th>
              <th className="px-4 py-2.5 text-center font-semibold">Min. Pikett</th>
              <th className="px-4 py-2.5 text-center font-semibold">Min. Betrieb</th>
              <th className="px-4 py-2.5 text-center font-semibold">SP / Tag</th>
              <th className="px-4 py-2.5 text-center font-semibold">Std / Jahr</th>
              <th className="px-4 py-2.5 text-center font-semibold">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => {
              const draft = getDraft(team);
              const isDirty = editDraft[team] !== undefined;
              return (
                <tr key={team} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium text-gray-800">{team}</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number" min={0} max={99} value={draft.minPikett}
                      onChange={e => setDraftField(team, 'minPikett', e.target.value)}
                      className="w-16 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number" min={0} max={99} value={draft.minBetrieb}
                      onChange={e => setDraftField(team, 'minBetrieb', e.target.value)}
                      className="w-16 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number" min={0.1} step={0.5} value={draft.storyPointsPerDay}
                      onChange={e => setDraftField(team, 'storyPointsPerDay', e.target.value)}
                      className="w-16 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number" min={800} max={2200} step={100} value={draft.hoursPerYear}
                      onChange={e => setDraftField(team, 'hoursPerYear', e.target.value)}
                      className="w-20 text-center border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => saveSingle(team)}
                      disabled={!isDirty}
                      className={[
                        'px-3 py-1 text-xs rounded transition-colors',
                        isDirty
                          ? 'bg-bund-blau text-white hover:bg-blue-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                      ].join(' ')}
                    >
                      Speichern
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="mt-3 text-xs text-gray-400 space-y-0.5">
        <p>Pikett-Lücken werden täglich gemeldet (auch Wochenenden + Feiertage). Betrieb-Lücken nur an Arbeitstagen.</p>
        <p>SP/Tag und Std/Jahr sind Referenzwerte für Kapazitätsberechnungen dieses Teams.</p>
      </div>
    </div>
  );
}
