import { useState } from 'react';
import type { CustomAllocationType, AllocationCategory } from '../../types';
import { ALLOCATION_CATEGORY_LABEL, BUILTIN_KUERZEL } from '../../constants';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface Props {
  customTypes: CustomAllocationType[];
  onChange: (types: CustomAllocationType[]) => void;
}

const CATEGORIES: AllocationCategory[] = ['ABSENCE', 'BETRIEB', 'PIKETT', 'BETRIEB_PIKETT', 'NEUTRAL'];

const EMPTY_FORM = {
  kuerzel: '',
  label: '',
  bg: '#60A5FA',
  text: '#FFFFFF',
  category: 'NEUTRAL' as AllocationCategory,
  team: '',
};

export default function CustomAllocationSettings({ customTypes, onChange }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fehler, setFehler] = useState('');
  const [showForm, setShowForm] = useState(false);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setFehler('');
  }

  function validate(): string {
    const k = form.kuerzel.trim().toUpperCase();
    if (!k || k.length > 3) return 'Kürzel muss 1–3 Zeichen lang sein.';
    if (!form.label.trim()) return 'Bezeichnung ist erforderlich.';
    if (BUILTIN_KUERZEL.has(k)) return `Kürzel «${k}» ist bereits ein Standard-Buchungstyp.`;
    const conflict = customTypes.find(ct => ct.kuerzel.toUpperCase() === k && ct.id !== editId);
    if (conflict) return `Kürzel «${k}» wird bereits von «${conflict.label}» verwendet.`;
    return '';
  }

  function handleSave() {
    const err = validate();
    if (err) { setFehler(err); return; }

    if (editId) {
      onChange(customTypes.map(ct =>
        ct.id === editId
          ? { ...ct, kuerzel: form.kuerzel.trim().toUpperCase(), label: form.label.trim(), bg: form.bg, text: form.text, category: form.category, team: form.team || undefined }
          : ct
      ));
    } else {
      const id = `CUSTOM_${form.kuerzel.trim().toUpperCase()}_${Date.now()}`;
      onChange([...customTypes, {
        id,
        kuerzel: form.kuerzel.trim().toUpperCase(),
        label: form.label.trim(),
        bg: form.bg,
        text: form.text,
        category: form.category,
        team: form.team || undefined,
      }]);
    }
    resetForm();
  }

  function startEdit(ct: CustomAllocationType) {
    setEditId(ct.id);
    setForm({ kuerzel: ct.kuerzel, label: ct.label, bg: ct.bg, text: ct.text, category: ct.category, team: ct.team ?? '' });
    setShowForm(true);
    setFehler('');
  }

  function handleDelete(id: string) {
    onChange(customTypes.filter(ct => ct.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-primary-700 mb-4">Benutzerdefinierte Buchungstypen</h2>
      <p className="text-sm text-gray-500 mb-4">
        Erstellen Sie eigene Buchungstypen für diesen Train. Jeder Typ hat ein Kürzel (max. 3 Zeichen),
        eine Farbe und eine Berechnungskategorie, die bestimmt wie der Typ in der SP-Berechnung behandelt wird.
      </p>

      {/* Tabelle */}
      {customTypes.length > 0 && (
        <table className="w-full text-sm mb-4 border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Kürzel</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Bezeichnung</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Farbe</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Kategorie</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Team</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {customTypes.map(ct => (
              <tr key={ct.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono font-bold">{ct.kuerzel}</td>
                <td className="px-3 py-2">{ct.label}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-block w-6 h-6 rounded border border-gray-200 text-center text-[10px] leading-6"
                    style={{ backgroundColor: ct.bg, color: ct.text }}
                  >
                    {ct.kuerzel}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{ALLOCATION_CATEGORY_LABEL[ct.category]}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{ct.team ?? 'Alle'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => startEdit(ct)}
                    className="text-gray-500 hover:text-primary-700 p-1"
                    title="Bearbeiten"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(ct.id)}
                    className="text-gray-500 hover:text-red-600 p-1 ml-1"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {customTypes.length === 0 && !showForm && (
        <div className="text-sm text-gray-400 mb-4 p-4 border border-dashed border-gray-200 rounded text-center">
          Noch keine benutzerdefinierten Buchungstypen erstellt.
        </div>
      )}

      {/* Formular */}
      {showForm ? (
        <div className="border border-gray-200 rounded p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {editId ? 'Buchungstyp bearbeiten' : 'Neuer Buchungstyp'}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kürzel (max. 3 Zeichen)</label>
              <input
                type="text"
                value={form.kuerzel}
                onChange={e => setForm({ ...form, kuerzel: e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) })}
                maxLength={3}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono uppercase"
                placeholder="z.B. R"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bezeichnung</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="z.B. Portöffnungen"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hintergrundfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bg}
                  onChange={e => setForm({ ...form, bg: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{form.bg}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Schriftfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.text}
                  onChange={e => setForm({ ...form, text: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{form.text}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Berechnungskategorie</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as AllocationCategory })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{ALLOCATION_CATEGORY_LABEL[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Team (optional)</label>
              <input
                type="text"
                value={form.team}
                onChange={e => setForm({ ...form, team: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                placeholder="Leer = alle Teams"
              />
            </div>
          </div>

          {/* Vorschau */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-600">Vorschau:</span>
            <span
              className="inline-block w-8 h-7 rounded text-center leading-7 text-xs font-bold"
              style={{ backgroundColor: form.bg, color: form.text }}
            >
              {form.kuerzel.toUpperCase() || '?'}
            </span>
          </div>

          {fehler && <p className="text-sm text-red-600 mb-3">{fehler}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-700 text-white rounded hover:bg-primary-800"
            >
              <Check size={14} />
              {editId ? 'Speichern' : 'Hinzufügen'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              <X size={14} />
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-700 text-white rounded hover:bg-primary-800"
        >
          <Plus size={14} />
          Neuen Buchungstyp hinzufügen
        </button>
      )}
    </div>
  );
}
