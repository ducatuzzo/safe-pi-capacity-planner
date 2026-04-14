import { useState, useRef, useMemo, useEffect } from 'react';
import { Pencil, Trash2, Trash, Plus, Upload, Download, Search, X, ChevronDown } from 'lucide-react';
import type { Employee, EmployeeType } from '../../types';

interface MitarbeiterFilter {
  suchtext: string;
  teams: string[];
  typ: '' | 'iMA' | 'eMA';
}

const LEERER_FILTER: MitarbeiterFilter = { suchtext: '', teams: [], typ: '' };

interface Props {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
}

const LEERER_MITARBEITER: Omit<Employee, 'id' | 'allocations'> = {
  vorname: '',
  name: '',
  team: '',
  type: 'iMA',
  fte: 1.0,
  capacityPercent: 100,
  betriebPercent: 0,
  pauschalPercent: 0,
  storyPointsPerDay: 1,
};

interface FormState extends Omit<Employee, 'id' | 'allocations'> {}

function validiereForm(f: FormState): string | null {
  if (!f.vorname.trim()) return 'Vorname ist erforderlich.';
  if (!f.name.trim()) return 'Name ist erforderlich.';
  if (!f.team.trim()) return 'Team ist erforderlich.';
  if (f.fte < 0 || f.fte > 1) return 'FTE muss zwischen 0.0 und 1.0 liegen.';
  if (f.capacityPercent < 0 || f.capacityPercent > 100) return 'Kapazität muss zwischen 0 und 100 liegen.';
  if (f.betriebPercent < 0 || f.betriebPercent > 100) return 'Betrieb% muss zwischen 0 und 100 liegen.';
  if (f.pauschalPercent < 0 || f.pauschalPercent > 100) return 'Pauschale% muss zwischen 0 und 100 liegen.';
  if (f.betriebPercent + f.pauschalPercent > f.capacityPercent)
    return `Betrieb% (${f.betriebPercent}) + Pauschale% (${f.pauschalPercent}) darf nicht grösser sein als Kapazität% (${f.capacityPercent}).`;
  if (f.storyPointsPerDay <= 0) return 'Story Points/Tag muss grösser als 0 sein.';
  return null;
}

export default function MitarbeiterSettings({ employees, onChange }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...LEERER_MITARBEITER });
  const [fehler, setFehler] = useState<string | null>(null);
  const [importFehler, setImportFehler] = useState<string | null>(null);
  const [loescheAlleBestaetigung, setLoescheAlleBestaetigung] = useState(false);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<MitarbeiterFilter>(LEERER_FILTER);
  const [teamDropdownOffen, setTeamDropdownOffen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  const verfuegbareTeams = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(ma => { if (ma.team) set.add(ma.team); });
    return Array.from(set).sort();
  }, [employees]);

  const filterAktiv = filter.suchtext.trim() !== '' || filter.teams.length > 0 || filter.typ !== '';

  const gefilterteMitarbeiter = useMemo(() => {
    return employees.filter(ma => {
      const suche = filter.suchtext.toLowerCase();
      const nameMatch = !suche ||
        ma.vorname.toLowerCase().includes(suche) ||
        ma.name.toLowerCase().includes(suche);
      const teamMatch = filter.teams.length === 0 || filter.teams.includes(ma.team);
      const typMatch = !filter.typ || ma.type === filter.typ;
      return nameMatch && teamMatch && typMatch;
    });
  }, [employees, filter]);

  useEffect(() => {
    if (!teamDropdownOffen) return;
    function handler(e: MouseEvent) {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOffen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [teamDropdownOffen]);

  function toggleTeam(team: string) {
    setFilter(f => ({
      ...f,
      teams: f.teams.includes(team) ? f.teams.filter(t => t !== team) : [...f.teams, team],
    }));
  }

  function toggleAlleTeams() {
    setFilter(f => ({
      ...f,
      teams: f.teams.length === verfuegbareTeams.length ? [] : [...verfuegbareTeams],
    }));
  }

  function oeffneNeu() {
    setForm({ ...LEERER_MITARBEITER });
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }

  function oeffneBearbeiten(ma: Employee) {
    setForm({
      vorname: ma.vorname,
      name: ma.name,
      team: ma.team,
      type: ma.type,
      fte: ma.fte,
      capacityPercent: ma.capacityPercent,
      betriebPercent: ma.betriebPercent,
      pauschalPercent: ma.pauschalPercent,
      storyPointsPerDay: ma.storyPointsPerDay,
    });
    setBearbeiteteId(ma.id);
    setFehler(null);
    setModalOffen(true);
  }

  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }

  function speichern() {
    const validierungsFehler = validiereForm(form);
    if (validierungsFehler) {
      setFehler(validierungsFehler);
      return;
    }
    if (bearbeiteteId) {
      onChange(employees.map(ma =>
        ma.id === bearbeiteteId ? { ...ma, ...form } : ma
      ));
    } else {
      const neuerMa: Employee = {
        id: crypto.randomUUID(),
        ...form,
        allocations: {},
      };
      onChange([...employees, neuerMa]);
    }
    schliesseModal();
  }

  function loeschen(id: string) {
    onChange(employees.filter(ma => ma.id !== id));
    setLoescheIdBestaetigung(null);
  }

  function loescheAlle() {
    onChange([]);
    setLoescheAlleBestaetigung(false);
  }

  function exportiereCsv() {
    const BOM = '\uFEFF';
    const header = 'vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag';
    const zeilen = employees.map(ma =>
      [ma.vorname, ma.name, ma.team, ma.type, ma.fte, ma.capacityPercent, ma.betriebPercent, ma.pauschalPercent, ma.storyPointsPerDay].join(';')
    );
    const inhalt = BOM + [header, ...zeilen].join('\n');
    const blob = new Blob([inhalt], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const datum = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mitarbeiter_${datum}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importiereCsv(e: React.ChangeEvent<HTMLInputElement>) {
    setImportFehler(null);
    const datei = e.target.files?.[0];
    if (!datei) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;
        // BOM entfernen falls vorhanden
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const zeilen = text.split(/\r?\n/).filter(z => z.trim());
        if (zeilen.length < 2) throw new Error('CSV enthält keine Datenzeilen.');
        const kopf = zeilen[0].split(';').map(s => s.trim().toLowerCase());
        // Flexibler Header-Check: mindestens vorname, name, team, typ
        if (!kopf.includes('vorname') || !kopf.includes('name') || !kopf.includes('team') || !kopf.includes('typ')) {
          throw new Error('Ungültiger CSV-Header. Erwartet: vorname;name;team;typ;fte;kapazitaetProzent;betriebProzent;pauschalProzent;spProTag');
        }
        const idx = {
          vorname: kopf.indexOf('vorname'),
          name: kopf.indexOf('name'),
          team: kopf.indexOf('team'),
          typ: kopf.indexOf('typ'),
          fte: kopf.indexOf('fte'),
          kapa: kopf.indexOf('kapazitaetprozent'),
          betrieb: kopf.indexOf('betriebprozent'),
          pausch: kopf.indexOf('pauschalprozent'),
          sp: kopf.indexOf('sproTag'.toLowerCase()),
        };
        const neueMitarbeiter: Employee[] = [];
        for (let i = 1; i < zeilen.length; i++) {
          const felder = zeilen[i].split(';');
          const typ = felder[idx.typ]?.trim() as EmployeeType;
          if (typ !== 'iMA' && typ !== 'eMA') throw new Error(`Zeile ${i + 1}: Typ muss iMA oder eMA sein.`);
          neueMitarbeiter.push({
            id: crypto.randomUUID(),
            vorname: felder[idx.vorname]?.trim() ?? '',
            name: felder[idx.name]?.trim() ?? '',
            team: felder[idx.team]?.trim() ?? '',
            type: typ,
            fte: idx.fte >= 0 ? parseFloat(felder[idx.fte]) || 1.0 : 1.0,
            capacityPercent: idx.kapa >= 0 ? parseInt(felder[idx.kapa]) || 100 : 100,
            betriebPercent: idx.betrieb >= 0 ? parseInt(felder[idx.betrieb]) || 0 : 0,
            pauschalPercent: idx.pausch >= 0 ? parseInt(felder[idx.pausch]) || 0 : 0,
            storyPointsPerDay: idx.sp >= 0 ? parseFloat(felder[idx.sp]) || 1 : 1,
            allocations: {},
          });
        }
        onChange([...employees, ...neueMitarbeiter]);
      } catch (err) {
        setImportFehler(err instanceof Error ? err.message : 'Unbekannter Fehler beim CSV-Import.');
      }
      // Input zurücksetzen für erneuten Import
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(datei, 'UTF-8');
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-bund-blau">Mitarbeiterstamm</h2>
        <div className="flex gap-2">
          <button
            onClick={oeffneNeu}
            className="flex items-center gap-1 px-3 py-2 bg-bund-blau text-white text-sm rounded hover:bg-[#002D5C] transition-colors"
          >
            <Plus size={16} />
            Neu
          </button>
          <button
            onClick={exportiereCsv}
            disabled={employees.length === 0}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            CSV Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
          >
            <Upload size={16} />
            CSV Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={importiereCsv}
          />
          {employees.length > 0 && (
            <button
              onClick={() => setLoescheAlleBestaetigung(true)}
              className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 text-sm rounded hover:bg-red-100 transition-colors"
            >
              <Trash size={16} />
              Alle löschen
            </button>
          )}
        </div>
      </div>

      {/* Import-Fehler */}
      {importFehler && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
          {importFehler}
          <button onClick={() => setImportFehler(null)} className="ml-2 underline">Schliessen</button>
        </div>
      )}

      {/* Filterleiste */}
      {employees.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filter.suchtext}
              onChange={e => setFilter(f => ({ ...f, suchtext: e.target.value }))}
              placeholder="Suche nach Name..."
              className="w-64 pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
            />
          </div>

          <div ref={teamDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setTeamDropdownOffen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 min-w-[140px] justify-between"
            >
              <span>
                {filter.teams.length === 0
                  ? 'Alle Teams'
                  : filter.teams.length === 1
                    ? filter.teams[0]
                    : `${filter.teams.length} Teams`}
              </span>
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {teamDropdownOffen && (
              <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded shadow-lg py-1 max-h-64 overflow-y-auto">
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={filter.teams.length === verfuegbareTeams.length && verfuegbareTeams.length > 0}
                    onChange={toggleAlleTeams}
                  />
                  <span className="font-medium">Alle Teams</span>
                </label>
                {verfuegbareTeams.map(team => (
                  <label key={team} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter.teams.includes(team)}
                      onChange={() => toggleTeam(team)}
                    />
                    <span>{team}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <select
            value={filter.typ}
            onChange={e => setFilter(f => ({ ...f, typ: e.target.value as '' | 'iMA' | 'eMA' }))}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-bund-blau"
          >
            <option value="">Alle Typen</option>
            <option value="iMA">iMA</option>
            <option value="eMA">eMA</option>
          </select>

          {filterAktiv && (
            <button
              type="button"
              onClick={() => setFilter(LEERER_FILTER)}
              className="flex items-center gap-1 text-sm text-bund-blau hover:underline"
            >
              <X size={14} />
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Tabelle */}
      {employees.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded">
          <p>Keine Mitarbeiter erfasst. Klicken Sie auf «Neu» oder importieren Sie eine CSV-Datei.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-bund-blau text-white text-left">
                <th className="px-3 py-2">Vorname</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Team</th>
                <th className="px-3 py-2">Typ</th>
                <th className="px-3 py-2 text-right">FTE</th>
                <th className="px-3 py-2 text-right">Kapa%</th>
                <th className="px-3 py-2 text-right">Betrieb%</th>
                <th className="px-3 py-2 text-right">Pauschale%</th>
                <th className="px-3 py-2 text-right">SP/Tag</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {gefilterteMitarbeiter.map((ma, i) => (
                <tr key={ma.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2">{ma.vorname}</td>
                  <td className="px-3 py-2">{ma.name}</td>
                  <td className="px-3 py-2">{ma.team}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ma.type === 'iMA' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                      {ma.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{ma.fte.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">{ma.capacityPercent}</td>
                  <td className="px-3 py-2 text-right">{ma.betriebPercent}</td>
                  <td className="px-3 py-2 text-right">{ma.pauschalPercent}</td>
                  <td className="px-3 py-2 text-right">{ma.storyPointsPerDay}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => oeffneBearbeiten(ma)}
                        className="p-1 text-gray-500 hover:text-bund-blau transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setLoescheIdBestaetigung(ma.id)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">
            {filterAktiv
              ? `${gefilterteMitarbeiter.length} von ${employees.length} Mitarbeiter`
              : `${employees.length} Mitarbeiter`}
          </p>
          {filterAktiv && gefilterteMitarbeiter.length === 0 && (
            <p className="text-sm text-gray-500 mt-3">Keine Mitarbeiter entsprechen den Filterkriterien.</p>
          )}
        </div>
      )}

      {/* Modal: Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-bund-blau">
                {bearbeiteteId ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
              </h3>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              <FormFeld label="Vorname *" value={form.vorname} onChange={v => setForm(f => ({ ...f, vorname: v }))} />
              <FormFeld label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <FormFeld label="Team *" value={form.team} onChange={v => setForm(f => ({ ...f, team: v }))} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Typ *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as EmployeeType }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  <option value="iMA">iMA (intern)</option>
                  <option value="eMA">eMA (extern)</option>
                </select>
              </div>
              <FormFeld label="FTE (0.0–1.0)" value={String(form.fte)} onChange={v => setForm(f => ({ ...f, fte: parseFloat(v) || 0 }))} type="number" step="0.1" min="0" max="1" />
              <FormFeld label="Kapazität %" value={String(form.capacityPercent)} onChange={v => setForm(f => ({ ...f, capacityPercent: parseInt(v) || 0 }))} type="number" min="0" max="100" />
              <FormFeld label="Betrieb %" value={String(form.betriebPercent)} onChange={v => setForm(f => ({ ...f, betriebPercent: parseInt(v) || 0 }))} type="number" min="0" max="100" />
              <FormFeld label="Pauschale %" value={String(form.pauschalPercent)} onChange={v => setForm(f => ({ ...f, pauschalPercent: parseInt(v) || 0 }))} type="number" min="0" max="100" />
              <FormFeld label="Story Points/Tag" value={String(form.storyPointsPerDay)} onChange={v => setForm(f => ({ ...f, storyPointsPerDay: parseFloat(v) || 1 }))} type="number" step="0.5" min="0.5" />
            </div>
            {fehler && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
                {fehler}
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={schliesseModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={speichern}
                className="px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-[#002D5C] transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigung: Einzeln löschen */}
      {loescheIdBestaetigung && (
        <Bestaetigung
          meldung={`Mitarbeiter «${employees.find(m => m.id === loescheIdBestaetigung)?.vorname} ${employees.find(m => m.id === loescheIdBestaetigung)?.name}» wirklich löschen?`}
          onBestaetigen={() => loeschen(loescheIdBestaetigung)}
          onAbbrechen={() => setLoescheIdBestaetigung(null)}
        />
      )}

      {/* Bestätigung: Alle löschen */}
      {loescheAlleBestaetigung && (
        <Bestaetigung
          meldung={`Wirklich alle ${employees.length} Mitarbeiter löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          onBestaetigen={loescheAlle}
          onAbbrechen={() => setLoescheAlleBestaetigung(false)}
          gefaehrlich
        />
      )}
    </div>
  );
}

interface FormFeldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}

function FormFeld({ label, value, onChange, type = 'text', step, min, max }: FormFeldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
      />
    </div>
  );
}

interface BestaetigungProps {
  meldung: string;
  onBestaetigen: () => void;
  onAbbrechen: () => void;
  gefaehrlich?: boolean;
}

function Bestaetigung({ meldung, onBestaetigen, onAbbrechen, gefaehrlich }: BestaetigungProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <p className="text-sm text-gray-700 mb-6">{meldung}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onAbbrechen}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onBestaetigen}
            className={`px-4 py-2 text-sm text-white rounded transition-colors ${gefaehrlich ? 'bg-red-600 hover:bg-red-700' : 'bg-bund-blau hover:bg-[#002D5C]'}`}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
