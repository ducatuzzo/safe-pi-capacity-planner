import { useState, Fragment } from 'react';
import { Pencil, Trash2, Plus, CalendarOff } from 'lucide-react';
import type { PIPlanning, Iteration, PIBlockerWeek } from '../../types';
import { calculateIterationDates, calculatePIEndDate } from '../../utils/pi-calculator';

interface Props {
  pi: PIPlanning;
  onPiChange: (updatedPi: PIPlanning) => void;
}

interface IterFormState {
  name: string;
  startStr: string;
  endStr: string;
}

interface BlockerFormState {
  afterIterationId: string;
  label: string;
  weeks: number;
}

const LEERE_ITERATION: IterFormState = { name: '', startStr: '', endStr: '' };
const LEERER_BLOCKER: BlockerFormState = { afterIterationId: '', label: '', weeks: 1 };

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

function validiereBlocker(f: BlockerFormState, pi: PIPlanning): string | null {
  if (!f.afterIterationId) return 'Bitte Iteration auswählen.';
  if (!pi.iterationen.some(it => it.id === f.afterIterationId)) {
    return 'Ungewählte Iteration ist ungültig.';
  }
  if (!f.label.trim()) return 'Bezeichnung ist erforderlich.';
  if (f.weeks < 1 || f.weeks > 12) return 'Dauer muss zwischen 1 und 12 Wochen liegen.';
  return null;
}

export default function IterationEditor({ pi, onPiChange }: Props) {
  const [modalOffen, setModalOffen] = useState(false);
  const [bearbeiteteId, setBearbeiteteId] = useState<string | null>(null);
  const [form, setForm] = useState<IterFormState>({ ...LEERE_ITERATION });
  const [fehler, setFehler] = useState<string | null>(null);
  const [loescheIdBestaetigung, setLoescheIdBestaetigung] = useState<string | null>(null);

  const [blockerModalOffen, setBlockerModalOffen] = useState(false);
  const [blockerForm, setBlockerForm] = useState<BlockerFormState>({ ...LEERER_BLOCKER });
  const [blockerFehler, setBlockerFehler] = useState<string | null>(null);
  const [blockerLoescheId, setBlockerLoescheId] = useState<string | null>(null);

  const blockerWeeks = pi.blockerWeeks ?? [];
  const istWochenbasiert = pi.iterationWeeks !== undefined && pi.iterationWeeks > 0;

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

    const neueIterationen = bearbeiteteId
      ? pi.iterationen.map(it => (it.id === bearbeiteteId ? { ...it, ...form } : it))
      : [...pi.iterationen, { id: crypto.randomUUID(), ...form }];
    onPiChange({ ...pi, iterationen: neueIterationen });
    schliesseModal();
  }

  function loeschen(id: string) {
    // Auch zugehörige Blocker entfernen, sonst verwaiste Referenzen
    const neueBlocker = blockerWeeks.filter(b => b.afterIterationId !== id);
    onPiChange({
      ...pi,
      iterationen: pi.iterationen.filter(it => it.id !== id),
      blockerWeeks: neueBlocker,
    });
    setLoescheIdBestaetigung(null);
  }

  // ─── Blocker-Wochen ────────────────────────────────────────────────────────

  function oeffneBlockerNeu() {
    const ersteIterId = pi.iterationen[0]?.id ?? '';
    setBlockerForm({ ...LEERER_BLOCKER, afterIterationId: ersteIterId });
    setBlockerFehler(null);
    setBlockerModalOffen(true);
  }

  function schliesseBlockerModal() {
    setBlockerModalOffen(false);
    setBlockerFehler(null);
  }

  /**
   * Wendet eine Liste von Blocker-Wochen an: berechnet alle Iterations-Daten
   * sowie das PI-Enddatum neu.
   */
  function wendeBlockerAn(neueBlocker: PIBlockerWeek[]) {
    if (!istWochenbasiert) return;
    const neueIterationen = calculateIterationDates({
      startDate: pi.startStr,
      iterationWeeks: pi.iterationWeeks!,
      iterations: pi.iterationen,
      blockerWeeks: neueBlocker,
    });
    onPiChange({
      ...pi,
      iterationen: neueIterationen,
      endStr: calculatePIEndDate(neueIterationen),
      blockerWeeks: neueBlocker,
    });
  }

  function speichereBlocker() {
    const err = validiereBlocker(blockerForm, pi);
    if (err) { setBlockerFehler(err); return; }
    const neuerBlocker: PIBlockerWeek = {
      id: crypto.randomUUID(),
      afterIterationId: blockerForm.afterIterationId,
      label: blockerForm.label.trim(),
      weeks: blockerForm.weeks,
    };
    wendeBlockerAn([...blockerWeeks, neuerBlocker]);
    schliesseBlockerModal();
  }

  function loescheBlocker(id: string) {
    wendeBlockerAn(blockerWeeks.filter(b => b.id !== id));
    setBlockerLoescheId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-bund-blau uppercase tracking-wide">
          Iterationen – {pi.name}
        </span>
        <div className="flex gap-2">
          <button
            onClick={oeffneBlockerNeu}
            disabled={!istWochenbasiert || pi.iterationen.length === 0}
            title={
              !istWochenbasiert
                ? 'Blocker-Wochen sind nur für wochenbasierte PIs verfügbar (iterationWeeks fehlt)'
                : 'Blocker-Woche nach einer Iteration einschieben'
            }
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CalendarOff size={13} />
            Blocker
          </button>
          <button
            onClick={oeffneNeu}
            className="flex items-center gap-1 px-2 py-1 bg-bund-blau text-white text-xs rounded hover:bg-blue-900 transition-colors"
          >
            <Plus size={13} />
            Iteration
          </button>
        </div>
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
            {pi.iterationen.map(it => {
              const blockerNach = blockerWeeks.filter(b => b.afterIterationId === it.id);
              return (
                <Fragment key={it.id}>
                  <tr className="border-b border-blue-100 hover:bg-blue-100 transition-colors">
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
                  {blockerNach.map(b => (
                    <tr key={b.id} className="bg-gray-100/70 border-b border-blue-100">
                      <td colSpan={3} className="py-1 px-2 text-gray-600 italic">
                        <CalendarOff size={11} className="inline-block mr-1 text-gray-500" />
                        BLOCKER: {b.label} · {b.weeks} {b.weeks === 1 ? 'Woche' : 'Wochen'} · nach {it.name}
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setBlockerLoescheId(b.id)}
                            className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Blocker löschen"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
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

      {/* Modal: Blocker-Woche einfügen */}
      {blockerModalOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-bund-blau">Blocker-Woche einfügen</h3>
              <p className="text-xs text-gray-500 mt-0.5">PI: {pi.name}</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nach Iteration *</label>
                <select
                  value={blockerForm.afterIterationId}
                  onChange={e => setBlockerForm(f => ({ ...f, afterIterationId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
                >
                  {pi.iterationen.map(it => (
                    <option key={it.id} value={it.id}>{it.name}</option>
                  ))}
                </select>
              </div>
              <FormFeld
                label="Bezeichnung *"
                value={blockerForm.label}
                onChange={v => setBlockerForm(f => ({ ...f, label: v }))}
              />
              <FormFeldZahl
                label="Dauer (Wochen) *"
                value={blockerForm.weeks}
                onChange={v => setBlockerForm(f => ({ ...f, weeks: v }))}
                min={1}
                max={12}
              />
              <p className="text-xs text-gray-500">
                Alle nachfolgenden Iterationen werden automatisch nach hinten verschoben.
                Das PI-Enddatum verlängert sich entsprechend.
              </p>
            </div>
            {blockerFehler && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded">
                {blockerFehler}
              </div>
            )}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={schliesseBlockerModal}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={speichereBlocker}
                className="px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors"
              >
                Einfügen
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
              {blockerWeeks.some(b => b.afterIterationId === loescheIdBestaetigung) &&
                ' Zugehörige Blocker-Wochen werden ebenfalls entfernt.'}
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

      {/* Bestätigung: Blocker löschen */}
      {blockerLoescheId && (() => {
        const b = blockerWeeks.find(b => b.id === blockerLoescheId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
              <p className="text-sm text-gray-700 mb-6">
                Blocker-Woche «{b?.label}» wirklich entfernen?
                Iterationen werden neu berechnet, das PI-Enddatum verkürzt sich.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setBlockerLoescheId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => loescheBlocker(blockerLoescheId)}
                  className="px-4 py-2 text-sm bg-bund-blau text-white rounded hover:bg-blue-900 transition-colors"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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

interface FormFeldZahlProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

function FormFeldZahl({ label, value, onChange, min, max }: FormFeldZahlProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bund-blau"
      />
    </div>
  );
}
