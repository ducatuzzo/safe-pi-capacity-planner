import { useState, useRef, Fragment } from 'react';
import { Pencil, Trash2, Trash, Plus, Upload, Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { PIPlanning, Iteration } from '../../types';
import IterationEditor from './IterationEditor';

interface Props {
  pis: PIPlanning[];
  onChange: (pis: PIPlanning[]) => void;
}

interface PiFormState {
  name: string;
  startStr: string;
  endStr: string;
}

const LEERES_PI: PiFormState = { name: '', startStr: '', endStr: '' };

function validierePI(f: PiFormState): string | null {
  if (!f.name.trim()) return 'Name ist erforderlich.';
  if (!f.startStr) return 'Startdatum ist erforderlich.';
  if (!f.endStr) return 'Enddatum ist erforderlich.';
  if (f.startStr >= f.endStr) return 'Startdatum muss vor dem Enddatum liegen.';
  return null;
}

function addTage(dateStr: string, tage: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + tage);
  return d.toISOString().slice(0, 10);
}

function tageZwischen(startStr: string, endStr: string): number {
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function teilePiInIterationen(startStr: string, endStr: string, anzahl = 4): Iteration[] {
  const gesamtTage = tageZwischen(startStr, endStr);
  const basisTage = Math.floor(gesamtTage / anzahl);
  const rest = gesamtTage % anzahl;
  const iterationen: Iteration[] = [];
  let aktuellerStart = startStr;

  for (let i = 0; i < anzahl; i++) {
    const tage = basisTage + (i < rest ? 1 : 0);
    const aktuellesEnd = i === anzahl - 1 ? endStr : addTage(aktuellerStart, tage - 1);
    iterationen.push({
      id: crypto.randomUUID(),
      name: `IT${i + 1}`,
      startStr: aktuellerStart,
      endStr: aktuellesEnd,
    });
    aktuellerStart = addTage(aktuellesEnd, 1);
  }

  return iterationen;
}

export default function PISettings({ pis, onChange }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<PiFormState>({ ...LEERES_PI });
  const [fehler, setFehler] = useState<string | null>(null);
  const [importFehler, setImportFehler] = useState<string | null>(null);
  const [ausgeklappt, setAusgeklappt] = useState<Set<string>>(new Set());
  const [loescheAlleBestaetigung, setLoescheAlleBestaetigung] = useState(false);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function oeffneNeu() {
    setForm({ ...LEERES_PI });
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }

  function oeffneBearbeiten(pi: PIPlanning) {
    setForm({ name: pi.name, startStr: pi.startStr, endStr: pi.endStr });
    setBearbeiteteId(pi.id);
    setFehler(null);
    setModalOffen(true);
  }

  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }

  function speichern() {
    const err = validierePI(form);
    if (err) { setFehler(err); return; }

    if (bearbeiteteId) {
      onChange(pis.map(pi =>
        pi.id === bearbeiteteId ? { ...pi, ...form } : pi
      ));
    } else {
      const neuesPi: PIPlanning = {
        id: crypto.randomUUID(),
        ...form,
        iterationen: teilePiInIterationen(form.startStr, form.endStr),
      };
      onChange([...pis, neuesPi]);
    }
    schliesseModal();
  }

  function loeschen(id: string) {
    onChange(pis.filter(pi => pi.id !== id));
    setAusgeklappt(prev => { const s = new Set(prev); s.delete(id); return s; });
    setLoescheIdBestaetigung(null);
  }

  function loescheAlle() {
    onChange([]);
    setAusgeklappt(new Set());
    setLoescheAlleBestaetigung(false);
  }

  function toggleAusgeklappt(id: string) {
    setAusgeklappt(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function aktualisiereIterationen(piId: string, iterationen: Iteration[]) {
    onChange(pis.map(pi => pi.id === piId ? { ...pi, iterationen } : pi));
  }

  function exportiereCsv() {
    const BOM = '\uFEFF';
    const header = 'name;startStr;endStr';
    const zeilen = pis.map(pi => `${pi.name};${pi.startStr};${pi.endStr}`);
    const inhalt = BOM + [header, ...zeilen].join('\n');
    const blob = new Blob([inhalt], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pi_planung_${new Date().toISOString().slice(0, 10)}.csv`;
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
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        const zeilen = text.split(/\r?\n/).filter(z => z.trim());
        if (zeilen.length < 2) throw new Error('CSV enthält keine Datenzeilen.');
        const kopf = zeilen[0].split(';').map(s => s.trim().toLowerCase());
        if (!kopf.includes('name') || !kopf.includes('startstr') || !kopf.includes('endstr')) {
          throw new Error('Ungültiger CSV-Header. Erwartet: name;startStr;endStr');
        }
        const idx = {
          name: kopf.indexOf('name'),
          start: kopf.indexOf('startstr'),
          end: kopf.indexOf('endstr'),
        };
        const neuePis: PIPlanning[] = [];
        for (let i = 1; i < zeilen.length; i++) {
          const felder = zeilen[i].split(';');
          const name = felder[idx.name]?.trim() ?? '';
          const startStr = felder[idx.start]?.trim() ?? '';
          const endStr = felder[idx.end]?.trim() ?? '';
          if (!name || !startStr || !endStr) throw new Error(`Zeile ${i + 1}: Name, Start und Ende sind erforderlich.`);
          if (startStr >= endStr) throw new Error(`Zeile ${i + 1}: Startdatum muss vor Enddatum liegen.`);
          neuePis.push({
            id: crypto.randomUUID(),
            name,
            startStr,
            endStr,
            iterationen: teilePiInIterationen(startStr, endStr),
          });
        }
        onChange([...pis, ...neuePis]);
      } catch (err) {
        setImportFehler(err instanceof Error ? err.message : 'Unbekannter Fehler beim CSV-Import.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(datei, 'UTF-8');
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-bund-blau">PI-Planung</h2>
        <div className="flex gap-2">
          <button
            onClick={oeffneNeu}
            className="flex items-center gap-1 px-3 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors"
          >
            <Plus size={16} />
            Neu
          </button>
          <button
            onClick={exportiereCsv}
            disabled={pis.length === 0}
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
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importiereCsv} />
          {pis.length > 0 && (
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

      {/* Tabelle */}
      {pis.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded">
          <p>Keine PIs erfasst. Klicken Sie auf «Neu» oder importieren Sie eine CSV-Datei.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-bund-blau text-white text-left">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">Ende</th>
                <th className="px-3 py-2 text-right">Iter.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pis.map((pi, i) => (
                <Fragment key={pi.id}>
                  <tr className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleAusgeklappt(pi.id)}
                        className="text-gray-400 hover:text-bund-blau transition-colors"
                        title={ausgeklappt.has(pi.id) ? 'Einklappen' : 'Iterationen anzeigen'}
                      >
                        {ausgeklappt.has(pi.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">{pi.name}</td>
                    <td className="px-3 py-2">{pi.startStr}</td>
                    <td className="px-3 py-2">{pi.endStr}</td>
                    <td className="px-3 py-2 text-right">{pi.iterationen.length}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => oeffneBearbeiten(pi)}
                          className="p-1 text-gray-500 hover:text-bund-blau transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setLoescheIdBestaetigung(pi.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {ausgeklappt.has(pi.id) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-3 bg-blue-50 border-t border-blue-100">
                        <IterationEditor
                          pi={pi}
                          onIterationenChange={(iter) => aktualisiereIterationen(pi.id, iter)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">{pis.length} PI{pis.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Modal: PI Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-bund-blau">
                {bearbeiteteId ? 'PI bearbeiten' : 'Neues PI'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <FormFeld label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <FormFeld label="Startdatum *" value={form.startStr} onChange={v => setForm(f => ({ ...f, startStr: v }))} type="date" />
                <FormFeld label="Enddatum *" value={form.endStr} onChange={v => setForm(f => ({ ...f, endStr: v }))} type="date" />
              </div>
              {!bearbeiteteId && (
                <p className="text-xs text-gray-500">
                  Iterationen werden automatisch gleichmässig in 4 Teile aufgeteilt und können danach manuell angepasst werden.
                </p>
              )}
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
                className="px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors"
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
          meldung={`PI «${pis.find(p => p.id === loescheIdBestaetigung)?.name}» und alle seine Iterationen wirklich löschen?`}
          onBestaetigen={() => loeschen(loescheIdBestaetigung)}
          onAbbrechen={() => setLoescheIdBestaetigung(null)}
        />
      )}

      {/* Bestätigung: Alle löschen */}
      {loescheAlleBestaetigung && (
        <Bestaetigung
          meldung={`Wirklich alle ${pis.length} PIs löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
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
}

function FormFeld({ label, value, onChange, type = 'text' }: FormFeldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
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
            className={`px-4 py-2 text-sm text-white rounded transition-colors ${gefaehrlich ? 'bg-red-600 hover:bg-red-700' : 'bg-bund-blau hover:bg-blue-900'}`}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
