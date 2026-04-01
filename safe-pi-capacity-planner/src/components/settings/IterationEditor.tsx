import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import type { PIPlanning, Iteration } from '../../types';

interface Props {
  pi: PIPlanning;
  onIterationenChange: (iterationen: Iteration[]) => void;
}

interface IterFormState {
  name: string;
  startStr: string;
  endStr: string;
}

const LEERE_ITERATION: IterFormState = { name: '', startStr: '', endStr: '' };

function validiereIteration(
  f: IterFormState,
  pi: PIPlanning,
  ausgeschlossenId: string | undefined,
  alleIterationen: Iteration[]
): string | null {
  if (!f.name.trim()) return 'Name ist erforderlich.';
  if (!f.startStr) return 'Startdatum ist erforderlich.';
  if (!f.endStr) return 'Enddatum ist erforderlich.';
  if (f.startStr >= f.endStr) return 'Startdatum muss vor dem Enddatum liegen.';
  if (f.startStr < pi.startStr) return `Startdatum muss innerhalb des PI-Zeitraums liegen (ab ${pi.startStr}).`;
  if (f.endStr > pi.endStr) return `Enddatum muss innerhalb des PI-Zeitraums liegen (bis ${pi.endStr}).`;

  for (const it of alleIterationen) {
    if (it.id === ausgeschlossenId) continue;
    if (f.startStr <= it.endStr && f.endStr >= it.startStr) {
      return `Überschneidung mit Iteration «${it.name}» (${it.startStr} – ${it.endStr}).`;
    }
  }

  return null;
}

export default function IterationEditor({ pi, onIterationenChange }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<IterFormState>({ ...LEERE_ITERATION });
  const [fehler, setFehler] = useState<string | null>(null);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);

  function oeffneNeu() {
    setForm({ ...LEERE_ITERATION });
    setBearbeiteteId(null);
    setFehler(null);
    setModalOffen(true);
  }

  function oeffneBearbeiten(it: Iteration) {
    setForm({ name: it.name, startStr: it.startStr, endStr: it.endStr });
    setBearbeiteteId(it.id);
    setFehler(null);
    setModalOffen(true);
  }

  function schliesseModal() {
    setModalOffen(false);
    setBearbeiteteId(null);
    setFehler(null);
  }

  function speichern() {
    const err = validiereIteration(form, pi, bearbeiteteId ?? undefined, pi.iterationen);
    if (err) { setFehler(err); return; }

    if (bearbeiteteId) {
      onIterationenChange(pi.iterationen.map(it =>
        it.id === bearbeiteteId ? { ...it, ...form } : it
      ));
    } else {
      onIterationenChange([...pi.iterationen, { id: crypto.randomUUID(), ...form }]);
    }
    schliesseModal();
  }

  function loeschen(id: string) {
    onIterationenChange(pi.iterationen.filter(it => it.id !== id));
    setLoescheIdBestaetigung(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-bund-blau uppercase tracking-wide">
          Iterationen – {pi.name}
        </span>
        <button
          onClick={oeffneNeu}
          className="flex items-center gap-1 px-2 py-1 bg-bund-blau text-white text-xs rounded hover:bg-blue-900 transition-colors"
        >
          <Plus size={13} />
          Iteration
        </button>
      </div>

      {pi.iterationen.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">Keine Iterationen. Klicken Sie auf «Iteration».</p>
      ) : (
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-blue-200 text-gray-600">
              <th className="py-1 px-2 text-left font-medium">Name</th>
              <th className="py-1 px-2 text-left font-medium">Start</th>
              <th className="py-1 px-2 text-left font-medium">Ende</th>
              <th className="py-1 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {pi.iterationen.map(it => (
              <tr key={it.id} className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
                <td className="py-1 px-2 font-medium">{it.name}</td>
                <td className="py-1 px-2">{it.startStr}</td>
                <td className="py-1 px-2">{it.endStr}</td>
                <td className="py-1 px-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => oeffneBearbeiten(it)}
                      className="p-0.5 text-gray-400 hover:text-bund-blau transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setLoescheIdBestaetigung(it.id)}
                      className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal: Iteration Neu / Bearbeiten */}
      {modalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">
                {bearbeiteteId ? 'Iteration bearbeiten' : 'Neue Iteration'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                PI: {pi.name} ({pi.startStr} – {pi.endStr})
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <FormFeld label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <div className="grid grid-cols-2 gap-3">
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

      {/* Bestätigung: Iteration löschen */}
      {loescheIdBestaetigung && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <p className="text-sm text-gray-700 mb-6">
              Iteration «{pi.iterationen.find(it => it.id === loescheIdBestaetigung)?.name}» wirklich löschen?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLoescheIdBestaetigung(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => loeschen(loescheIdBestaetigung)}
                className="px-4 py-2 text-sm bg-bund-blau text-white rounded hover:bg-blue-900 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
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
