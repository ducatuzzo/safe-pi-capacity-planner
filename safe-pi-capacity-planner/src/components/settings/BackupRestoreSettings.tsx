import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { BackupFile, FullAppState } from '../../types';

const APP_VERSION = '1.0.0';
const BACKUP_FORMAT_VERSION = '1.0';

interface Props {
  appState: FullAppState;
  onRestore: (state: FullAppState) => void;
}

export default function BackupRestoreSettings({ appState, onRestore }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolgsmeldung, setErfolgsmeldung] = useState<string | null>(null);

  // Export: AppState als JSON-Datei herunterladen
  const handleExport = () => {
    const jetzt = new Date();
    const backup: BackupFile = {
      version: BACKUP_FORMAT_VERSION,
      exportedAt: jetzt.toISOString(),
      appVersion: APP_VERSION,
      data: appState,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Dateiname: safe-pi-backup_YYYY-MM-DD_HH-MM.json
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateiname = `safe-pi-backup_${jetzt.getFullYear()}-${pad(jetzt.getMonth() + 1)}-${pad(jetzt.getDate())}_${pad(jetzt.getHours())}-${pad(jetzt.getMinutes())}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = dateiname;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import: JSON-Datei einlesen und validieren
  const handleImportClick = () => {
    setFehler(null);
    setErfolgsmeldung(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const datei = event.target.files?.[0];
    if (!datei) return;

    // Input zurücksetzen damit dieselbe Datei nochmals gewählt werden kann
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const inhalt = e.target?.result;
        if (typeof inhalt !== 'string') {
          setFehler('Die Datei konnte nicht gelesen werden.');
          return;
        }

        const parsed: unknown = JSON.parse(inhalt);
        const validierungsFehler = validiereDatei(parsed);
        if (validierungsFehler) {
          setFehler(validierungsFehler);
          return;
        }

        const backup = parsed as BackupFile;

        const bestaetigt = window.confirm(
          'Achtung: Alle aktuellen Daten werden überschrieben. Fortfahren?'
        );
        if (!bestaetigt) return;

        onRestore(backup.data);
        setErfolgsmeldung(
          `Backup erfolgreich importiert (erstellt am ${new Date(backup.exportedAt).toLocaleString('de-CH')}).`
        );
        setFehler(null);
      } catch {
        setFehler('Die Datei enthält kein gültiges JSON.');
      }
    };
    reader.readAsText(datei);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Backup / Restore</h2>
      <p className="text-sm text-gray-500 mb-6">
        Exportiert den gesamten App-Zustand (Mitarbeiter, PIs, Feiertage, Buchungen) als JSON-Datei
        und ermöglicht die Wiederherstellung aus einem früheren Backup.
      </p>

      <div className="flex flex-col gap-4 max-w-md">
        {/* Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Backup exportieren</h3>
          <p className="text-xs text-gray-400 mb-3">
            Lädt alle aktuellen Daten als versionierte JSON-Datei herunter.
          </p>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors"
          >
            <Download size={16} />
            Backup exportieren
          </button>
        </div>

        {/* Import */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Backup importieren</h3>
          <p className="text-xs text-gray-400 mb-3">
            Stellt den App-Zustand aus einer zuvor exportierten JSON-Datei wieder her. Alle
            aktuellen Daten werden überschrieben.
          </p>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 border border-bund-blau text-bund-blau text-sm rounded hover:bg-blue-50 transition-colors"
          >
            <Upload size={16} />
            Backup importieren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Fehlermeldung */}
        {fehler && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {fehler}
          </div>
        )}

        {/* Erfolgsmeldung */}
        {erfolgsmeldung && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {erfolgsmeldung}
          </div>
        )}
      </div>
    </div>
  );
}

// Validiert die geparste Backup-Datei; gibt Fehlermeldung zurück oder null
function validiereDatei(parsed: unknown): string | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return 'Die Datei ist kein gültiges Backup-Format.';
  }

  const obj = parsed as Record<string, unknown>;

  if (!obj.version || typeof obj.version !== 'string') {
    return 'Das Backup enthält kein gültiges Versionsfeld.';
  }

  if (obj.version !== BACKUP_FORMAT_VERSION) {
    return `Nicht unterstützte Backup-Version "${obj.version}". Erwartet: "${BACKUP_FORMAT_VERSION}".`;
  }

  if (!obj.exportedAt || typeof obj.exportedAt !== 'string') {
    return 'Das Backup enthält kein gültiges Exportdatum.';
  }

  if (typeof obj.data !== 'object' || obj.data === null) {
    return 'Das Backup enthält keine Nutzdaten (data-Feld fehlt).';
  }

  const data = obj.data as Record<string, unknown>;

  if (!Array.isArray(data.employees)) {
    return 'Das Backup enthält kein gültiges Mitarbeiter-Array.';
  }
  if (!Array.isArray(data.feiertage)) {
    return 'Das Backup enthält kein gültiges Feiertage-Array.';
  }
  if (!Array.isArray(data.schulferien)) {
    return 'Das Backup enthält kein gültiges Schulferien-Array.';
  }
  if (!Array.isArray(data.pis)) {
    return 'Das Backup enthält kein gültiges PI-Array.';
  }
  if (!Array.isArray(data.blocker)) {
    return 'Das Backup enthält kein gültiges Blocker-Array.';
  }
  if (!Array.isArray(data.teamZielwerte)) {
    return 'Das Backup enthält kein gültiges Team-Zielwerte-Array.';
  }

  return null;
}
