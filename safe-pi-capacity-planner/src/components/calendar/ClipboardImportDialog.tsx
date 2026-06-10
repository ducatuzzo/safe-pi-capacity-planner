import { ClipboardPaste, AlertTriangle, Check, X } from 'lucide-react';
import type { ClipboardParseResult } from '../../utils/clipboard-parser';

interface Props {
  result: ClipboardParseResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ClipboardImportDialog({ result, onConfirm, onCancel }: Props) {
  const hasWarnings =
    result.unmatchedEmployees.length > 0 ||
    result.unknownKuerzel.length > 0 ||
    result.dateParseErrors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
          <ClipboardPaste size={18} className="text-primary-700" />
          <h2 className="text-base font-semibold text-gray-800">Excel-Import Vorschau</h2>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-4 text-sm">
            <div className="bg-blue-50 rounded px-3 py-2 flex-1 text-center">
              <div className="text-lg font-bold text-primary-700">{result.bookings.length}</div>
              <div className="text-xs text-gray-500">Buchungen</div>
            </div>
            <div className="bg-blue-50 rounded px-3 py-2 flex-1 text-center">
              <div className="text-lg font-bold text-primary-700">{result.matchedEmployees}</div>
              <div className="text-xs text-gray-500">Mitarbeiter</div>
            </div>
          </div>

          {hasWarnings && (
            <div className="space-y-2">
              {result.unmatchedEmployees.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Nicht zugeordnet:</span>{' '}
                    {result.unmatchedEmployees.join(', ')}
                  </div>
                </div>
              )}
              {result.unknownKuerzel.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Unbekannte Kürzel:</span>{' '}
                    {result.unknownKuerzel.join(', ')}
                  </div>
                </div>
              )}
              {result.dateParseErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Datum nicht erkannt:</span>{' '}
                    {result.dateParseErrors.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.mode === 'raw' && result.bookings.length > 0 && (
            <div className="text-sm text-blue-600 bg-blue-50 rounded px-3 py-2">
              Raw-Modus: Spalten werden auf sichtbare Kalendertage, Zeilen auf sichtbare Mitarbeiter gemappt (in Reihenfolge).
            </div>
          )}

          {result.bookings.length === 0 && (
            <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
              Keine gültigen Buchungen erkannt. Prüfen Sie das Clipboard-Format
              {result.mode === 'raw'
                ? ' (Kürzel wie B, F, R, BP getrennt durch Tabs).'
                : ' (1. Zeile = Datumsköpfe, 1. Spalte = Mitarbeiternamen, Zellen = Kürzel).'}
            </div>
          )}

          <p className="text-xs text-gray-400">
            Tipp: Rückgängig mit Ctrl+Z nach dem Import.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            <X size={14} />
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={result.bookings.length === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-primary-700 text-white rounded hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
}
