// AdminGate: OTP-Style Modal für Admin-Code-Eingabe (6 Felder)
// Merkt sich den Code für 15 Minuten in sessionStorage

import { useState, useRef, useEffect, useCallback } from 'react';
import { Lock } from 'lucide-react';
import {
  getStoredAdminCode,
  storeAdminCode,
  clearStoredAdminCode,
} from '../../utils/admin-session';

export { clearStoredAdminCode };

interface AdminGateProps {
  onSubmit: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}

export default function AdminGate({ onSubmit, onCancel }: AdminGateProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Beim Mount: gespeicherten Code prüfen und direkt einreichen.
  // Wurde der Code zuvor via «Abbrechen» gelöscht, erscheint das leere Formular.
  useEffect(() => {
    const stored = getStoredAdminCode();
    if (stored) {
      void handleSubmitCode(stored);
    } else {
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitCode = useCallback(async (code: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(code);
      if (result.ok) {
        storeAdminCode(code);
      } else {
        setError(result.error ?? 'Falscher Code.');
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit]);

  function handleDigitChange(index: number, value: string) {
    const char = value.slice(-1); // nur letztes Zeichen
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'Enter') {
      const code = digits.join('');
      if (code.length === 6) void handleSubmitCode(code);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] ?? '';
    }
    setDigits(newDigits);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  }

  function handleConfirm() {
    const code = digits.join('');
    if (code.length === 6) void handleSubmitCode(code);
  }

  const code = digits.join('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-bund-blau/10 rounded-full p-2">
            <Lock className="w-5 h-5 text-bund-blau" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Admin-Zugang</h2>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          6-stelligen Admin-Code eingeben
        </p>

        {/* 6 OTP-Felder */}
        <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="password"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={submitting}
              className={[
                'w-11 h-12 text-center text-lg font-bold border-2 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-bund-blau focus:border-bund-blau',
                'disabled:opacity-50',
                digit ? 'border-bund-blau' : 'border-gray-300',
              ].join(' ')}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || code.length < 6}
            className="flex-1 bg-bund-blau text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-bund-blau/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Prüfen...' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </div>
  );
}
