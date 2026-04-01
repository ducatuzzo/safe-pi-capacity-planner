import { useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import type { TeamZielwerte } from '../../types';

interface Props {
  zielwerte: TeamZielwerte[];
  onChange: (zielwerte: TeamZielwerte[]) => void;
}

function parseNum(val: string, fallback: number): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? fallback : n;
}

export default function TeamZielwerteSettings({ zielwerte, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (team: string, feld: keyof Omit<TeamZielwerte, 'team'>, val: string) => {
    const fallbacks: Record<keyof Omit<TeamZielwerte, 'team'>, number> = {
      minPersonenPikett: 0,
      minPersonenBetrieb: 0,
      storyPointsPerDay: 1,
      standardstundenProJahr: 1600,
    };
    onChange(
      zielwerte.map(z =>
        z.team === team ? { ...z, [feld]: parseNum(val, fallbacks[feld]) } : z
      )
    );
  };

  const handleExport = () => {
    const header = 'team;minPersonenPikett;minPersonenBetrieb;storyPointsPerDay;standardstundenProJahr';
    const rows = zielwerte.map(
      z => `${z.team};${z.minPersonenPikett};${z.minPersonenBetrieb};${z.storyPointsPerDay};${z.standardstundenProJahr}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_zielwerte.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = (ev.target?.result as string) ?? '';
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('team;'));
        const parsed: TeamZielwerte[] = lines.map(line => {
          const [team, pip, bep, spd, shy] = line.split(';');
          return {
            team: team.trim(),
            minPersonenPikett: parseNum(pip, 0),
            minPersonenBetrieb: parseNum(bep, 0),
            storyPointsPerDay: parseNum(spd, 1),
            standardstundenProJahr: parseNum(shy, 1600),
          };
        });
        if (parsed.length > 0) onChange(parsed);
      } catch {
        // Fehler beim Parsen – keine Änderung
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team-Zielwerte</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Mindestbesetzung und Kapazitätsparameter pro Team. Wirken sofort auf die Lücken-Erkennung im Dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} /> Importieren
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Exportieren
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-600 w-20">Team</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">Min. Pikett</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">Min. Betrieb</th>
            <th className="text-right py-2 px-4 font-medium text-gray-600">SP / Tag</th>
            <th className="text-right py-2 pl-4 font-medium text-gray-600">Std / Jahr</th>
          </tr>
        </thead>
        <tbody>
          {zielwerte.map(z => (
            <tr key={z.team} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-4 font-semibold text-bund-blau">{z.team}</td>
              <td className="py-2 px-4 text-right">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={z.minPersonenPikett}
                  onChange={e => handleChange(z.team, 'minPersonenPikett', e.target.value)}
                  className="w-16 text-right border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-bund-blau"
                />
              </td>
              <td className="py-2 px-4 text-right">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={z.minPersonenBetrieb}
                  onChange={e => handleChange(z.team, 'minPersonenBetrieb', e.target.value)}
                  className="w-16 text-right border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-bund-blau"
                />
              </td>
              <td className="py-2 px-4 text-right">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={z.storyPointsPerDay}
                  onChange={e => handleChange(z.team, 'storyPointsPerDay', e.target.value)}
                  className="w-16 text-right border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-bund-blau"
                />
              </td>
              <td className="py-2 pl-4 text-right">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={z.standardstundenProJahr}
                  onChange={e => handleChange(z.team, 'standardstundenProJahr', e.target.value)}
                  className="w-20 text-right border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-bund-blau"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-gray-400">
        Hinweis: Änderungen wirken sofort. Pikett = PIKETT + BETRIEB_PIKETT, Betrieb = BETRIEB + BETRIEB_PIKETT.
      </p>
    </div>
  );
}
