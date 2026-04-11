// TenantGate: Splash-Screen zur Tenant-Auswahl beim App-Start
// Erscheint wenn kein aktiver Tenant in sessionStorage

import { useState, useEffect } from 'react';
import type { TenantInfo } from '../../types';
import { useTenant } from '../../hooks/useTenant';
import bundeslogo from '../../assets/bundeslogo.svg';

export default function TenantGate() {
  const { setTenant } = useTenant();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formular-State für neuen Tenant
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newAdminCode, setNewAdminCode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
      const res = await fetch(`${backendUrl}/api/tenants`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as TenantInfo[];
      setTenants(data);
      if (data.length > 0) setSelectedId(data[0].id);
    } catch (err) {
      setError('Trains konnten nicht geladen werden. Ist der Server erreichbar?');
      console.error('[TenantGate] Fehler beim Laden der Tenants:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleWeiter() {
    const tenant = tenants.find(t => t.id === selectedId);
    if (!tenant) return;
    setTenant(tenant.id, tenant.name);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!newId.trim() || !newName.trim() || !newAdminCode.trim()) {
      setCreateError('Alle Felder sind erforderlich.');
      return;
    }
    if (newAdminCode.length < 6) {
      setCreateError('Admin-Code muss mindestens 6 Zeichen lang sein.');
      return;
    }
    setCreating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
      const res = await fetch(`${backendUrl}/api/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId.trim(), name: newName.trim(), adminCode: newAdminCode }),
      });
      const body = await res.json() as { id?: string; name?: string; error?: string };
      if (!res.ok) {
        setCreateError(body.error ?? 'Fehler beim Anlegen des Trains.');
        return;
      }
      // Erfolg: Tenant auswählen und starten
      setTenant(body.id!, body.name!);
    } catch (err) {
      setCreateError('Verbindungsfehler. Bitte versuche es erneut.');
      console.error('[TenantGate] Fehler beim Anlegen:', err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-bund-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-bund-blau rounded-lg p-3 mb-4 w-full flex justify-center">
            <img
              src={bundeslogo}
              alt="Schweizerische Eidgenossenschaft"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-bund-blau text-center">
            SAFe PI Capacity Planner
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Bundesamt für Informatik und Telekommunikation BIT
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">Lädt...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={loadTenants}
              className="mt-2 text-sm text-bund-blau underline"
            >
              Erneut versuchen
            </button>
          </div>
        ) : !showCreateForm ? (
          <>
            {tenants.length === 0 ? (
              <p className="text-center text-gray-500 mb-6">Noch kein Train vorhanden.</p>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Train auswählen
                </label>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tenants.length > 0 && (
              <button
                onClick={handleWeiter}
                disabled={!selectedId}
                className="w-full bg-bund-blau text-white py-2.5 px-4 rounded-md font-medium hover:bg-bund-blau/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
              >
                Weiter →
              </button>
            )}

            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full text-bund-blau text-sm font-medium py-2 hover:underline"
            >
              + Neuen Train anlegen
            </button>
          </>
        ) : (
          /* Formular: Neuen Train anlegen */
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Neuen Train anlegen</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Train-ID <span className="text-gray-400 text-xs">(z.B. ps-net)</span>
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={e => setNewId(e.target.value.toLowerCase())}
                  placeholder="z.B. ps-net"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
                />
                <p className="text-xs text-gray-400 mt-1">Kleinbuchstaben, Ziffern, Bindestrich, 2–20 Zeichen</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Train-Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="z.B. PS-NET Train"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin-Code <span className="text-gray-400 text-xs">(min. 6 Zeichen)</span>
                </label>
                <input
                  type="password"
                  value={newAdminCode}
                  onChange={e => setNewAdminCode(e.target.value)}
                  placeholder="Sicherer Code für Admin-Bereich"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
                />
              </div>
            </div>

            {createError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">{createError}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-bund-blau text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-bund-blau/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Anlegen...' : 'Train anlegen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
