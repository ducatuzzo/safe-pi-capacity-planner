// Dokumentations-Downloads: Links zu den DOCX-Handbüchern im public/docs/ Ordner

import { FileDown } from 'lucide-react';

interface DokumentEintrag {
  dateiname: string;
  titel: string;
  beschreibung: string;
  version: string;
}

const DOKUMENTE: DokumentEintrag[] = [
  {
    dateiname: 'benutzerdokumentation_v1.4.docx',
    titel: 'Benutzerdokumentation',
    beschreibung: 'Bedienung aller Tabs, Buchungstypen, PI Dashboard, Einstellungen, FAQ',
    version: 'v1.4',
  },
  {
    dateiname: 'installationshandbuch_v1.0.docx',
    titel: 'Installationshandbuch',
    beschreibung: 'Voraussetzungen, Installation, lokaler Start, LAN-Betrieb, npm-Scripts',
    version: 'v1.0',
  },
  {
    dateiname: 'deployment_handbuch_v1.0.docx',
    titel: 'Deployment-Handbuch',
    beschreibung: 'Lokal, LAN-Server, Vercel Cloud, State-Persistenz, Update-Prozess',
    version: 'v1.0',
  },
  {
    dateiname: 'safe-kapa-planner-publish.docx',
    titel: 'Publikations-Anleitung',
    beschreibung: 'Schritt-für-Schritt: Local → GitHub → Vercel → Railway',
    version: 'v1.0',
  },
];

export default function DokumentationSettings() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Dokumentation</h2>
      <p className="text-sm text-gray-500 mb-6">
        Alle Handbücher als Word-Dokument (.docx) herunterladen.
      </p>

      <div className="space-y-3">
        {DOKUMENTE.map(dok => (
          <div
            key={dok.dateiname}
            className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{dok.titel}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                  {dok.version}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{dok.beschreibung}</p>
            </div>
            <a
              href={`/docs/${dok.dateiname}`}
              download={dok.dateiname}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bund-blau text-white text-sm rounded hover:bg-blue-900 transition-colors ml-4 flex-shrink-0"
            >
              <FileDown size={14} />
              .docx
            </a>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-gray-400">
        Zum Öffnen wird Microsoft Word oder ein kompatibler Reader benötigt.
      </p>
    </div>
  );
}
