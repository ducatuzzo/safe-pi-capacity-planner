import { Monitor } from 'lucide-react';

export default function MobileReadOnlyBanner() {
  return (
    <div className="md:hidden flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 text-xs px-3 py-2 rounded mb-3">
      <Monitor size={14} className="flex-shrink-0" />
      <span>Nur-Lese-Ansicht — Bearbeitung am Desktop</span>
    </div>
  );
}
