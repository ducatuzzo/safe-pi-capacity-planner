import { useState, useRef } from 'react';
import { Pencil, Trash2, Trash, Plus, Upload, Download } from 'lucide-react';
import type { DateRangeDefinition } from '../../types';

interface Props {
  titel: string;
  eintraege: DateRangeDefinition[];
  onChange: (eintraege: DateRangeDefinition[]) => void;
  csvDateiname: string;
  hinweis?: string;
}

interface FormState {
  name: string;
  startStr: string;
  endStr: string;
}

const LEER: FormState = { name: '', startStr: '', endStr: '' };

function validiere(f: FormState): string | null {
  if (!f.name.trim()) return 'Name ist erforderlich.';
  if (!f.startStr) return 'Startdatum ist erforderlich.';
  if (!f.endStr) return 'Enddatum ist erforderlich.';
  if (f.endStr < f.startStr) return 'Enddatum muss >= Startdatum sein.';
  return null;
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

export default function DateRangeTable({ titel, eintraege, onChange, csvDateiname, hinweis }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...LEER });
  const [fehler, setFehler] = useState<string | null>(null);
  const [importFehler, setImportFehler] = useState<string | null>(null);
  const [loescheAlleBestaetigung, setLoescheAlleBestaetigung] = useState(false);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function oeffneNeu() {
    setForm({ ...LEER });
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }

  function oeffneBearbeiten(eintrag: DateRangeDefinition) {
    setForm({ name: eintrag.name, startStr: eintrag.startStr, endStr: eintrag.endStr });
    setBearbeiteteId(eintrag.id);
    setFehler(null);
    setModalOffen(true);
  }

  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }

  function speichern() {
    const err = validiere(form);
    if (err) { setFehler(err); return; }

    if (bearbeiteteId) {
      onChange(eintraege.map(e => e.id === bearbeiteteId ? { ...e, ...form } : e));
    } else {
      onChange([...eintraege, { id: crypto.randomUUID(), ...form }]);
    }
    schliesseModal();
  }

  function loeschen(id: string) {
    onChange(eintraege.filter(e => e.id !== id));
    setLoescheIdBestaetigung(null);
  }

  function loescheAlle() {
    onChange([]);
    setLoescheAlleBestaetigung(false);
  }

  function exportiereCsv() {
    const BOM = '\uFEFF';
    const header = 'name;startStr;endStr';
    const zeilen = eintraege.map(e => `${e.name};${e.startStr};${e.endStr}`);
    const inhalt = BOM + [header, ...zeilen].join('\n');
    const blob = new Blob([inhalt], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvDateiname}_${new Date().toISOString().slice(0, 10)}.csv`;
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
        const neueEintraege: DateRangeDefinition[] = [];
        for (let i = 1; i < zeilen.length; i++) {
          const felder = zeilen[i].split(';');
          const name = felder[idx.name]?.trim() ?? '';
          const startStr = felder[idx.start]?.trim() ?? '';
          const endStr = felder[idx.end]?.trim() ?? '';
          if (!name || !startStr || !endStr) throw new Error(`Zeile ${i + 1}: Name, Start und Ende sind erforderlich.`);
          if (endStr < startStr) throw new Error(`Zeile ${i + 1}: Enddatum muss >= Startdatum sein.`);
          neueEintraege.push({ id: crypto.randomUUID(), name, startStr, endStr });
        }
        onChange([...eintraege, ...neueEintraege]);
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
        <h3 className="text-lg font-semibold text-bund-blau">{titel}</h3>
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
            disabled={eintraege.length === 0}
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
          {eintraege.length > 0 && (
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

      {/* Hinweis */}
      {hinweis && (
        <p className="text-xs text-gray-500 mb-3">{hinweis}</p>
      )}

      {/* Import-Fehler */}
      {importFehler && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
          {importFehler}
          <button onClick={() => setImportFehler(null)} className="ml-2 underline">Schliessen</button>
        </div>
      )}

      {/* Tabelle */}
      {eintraege.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-200 rounded">
          <p>Keine Einträge vorhanden. Klicken Sie auf «Neu» oder importieren Sie eine CSV-Datei.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-bund-blau text-white text-left">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Startdatum</th>
                <th className="px-3 py-2">Enddatum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {eintraege.map((eintrag, i) => (
                <tr key={eintrag.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium">{eintrag.name}</td>
                  <td className="px-3 py-2">{eintrag.startStr}</td>
                  <td className="px-3 py-2">{eintrag.endStr}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => oeffneBearbeiten(eintrag)}
                        className="p-1 text-gray-500 hover:text-bund-blau transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setLoescheIdBestaetigung(eintrag.id)}
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
            {eintraege.length} {eintraege.length === 1 ? 'Eintrag' : 'Einträge'}
          </p>
        </div>
      )}

      {/* Modal: Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-bund-blau">
                {bearbeiteteId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <FormFeld label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <FormFeld label="Startdatum *" value={form.startStr} onChange={v => setForm(f => ({ ...f, startStr: v }))} type="date" />
                <FormFeld label="Enddatum *" value={form.endStr} onChange={v => setForm(f => ({ ...f, endStr: v }))} type="date" />
              </div>
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
          meldung={`Eintrag «${eintraege.find(e => e.id === loescheIdBestaetigung)?.name}» wirklich löschen?`}
          onBestaetigen={() => loeschen(loescheIdBestaetigung)}
          onAbbrechen={() => setLoescheIdBestaetigung(null)}
        />
      )}

      {/* Bestätigung: Alle löschen */}
      {loescheAlleBestaetigung && (
        <Bestaetigung
          meldung={`Wirklich alle ${eintraege.length} Einträge löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          onBestaetigen={loescheAlle}
          onAbbrechen={() => setLoescheAlleBestaetigung(false)}
          gefaehrlich
        />
      )}
    </div>
  );
}
