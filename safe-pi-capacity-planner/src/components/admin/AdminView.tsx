// AdminView: Admin-Bereich mit Tenant-Verwaltung und gefährlichen Aktionen
// Zugriffsschutz via AdminGate (6-stelliger OTP-Code)

import { useState, useEffect, useCallback } from 'react';
import { Shield, RefreshCw, KeyRound, PlusCircle, ArrowRightLeft } from 'lucide-react';
import type { TenantInfo } from '../../types';
import AdminGate, { clearStoredAdminCode } from './AdminGate';
import { useTenant } from '../../hooks/useTenant';

interface AdminViewProps {
  tenantId: string;
  tenantName: string;
  onCancel: () => void;
}

type AdminScreen = 'gate' | 'view';

export default function AdminView({ tenantId, tenantName, onCancel }: AdminViewProps) {
  const [screen, setScreen] = useState<AdminScreen>('gate');
  const [verifiedCode, setVerifiedCode] = useState('');

  async function handleGateSubmit(code: string): Promise<{ ok: boolean; error?: string }> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';
    // Wir verifizieren durch einen PATCH-Versuch ohne Änderung (leerer Body mit nur adminCode)
    // Da kein echter "verify"-Endpoint existiert, nutzen wir den Reset-Endpoint als Test
    // Besser: wir nutzen PATCH mit nur adminCode und keinem name/newAdminCode-Update
    const res = await fetch(`${backendUrl}/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode: code }),
    });
    if (res.ok) {
      setVerifiedCode(code);
      setScreen('view');
      return { ok: true };
    }
    if (res.status === 429) {
      return { ok: false, error: 'Zu viele Versuche. Bitte 60 Sekunden warten.' };
    }
    if (res.status === 401) {
      return { ok: false, error: 'Falscher Code.' };
    }
    return { ok: false, error: 'Fehler bei der Verifikation.' };
  }

  function handleGateCancel() {
    // Reihenfolge: erst Code-Cache leeren, dann Navigation auslösen.
    // Verhindert, dass AdminGate beim erneuten Mount den alten Code auto-submitted.
    clearStoredAdminCode();
    onCancel();
  }

  if (screen === 'gate') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <AdminGate onSubmit={handleGateSubmit} onCancel={handleGateCancel} />
      </div>
    );
  }

  return (
    <AdminViewContent
      tenantId={tenantId}
      tenantName={tenantName}
      verifiedCode={verifiedCode}
      onCodeInvalid={() => {
        clearStoredAdminCode();
        setScreen('gate');
      }}
    />
  );
}

interface AdminViewContentProps {
  tenantId: string;
  tenantName: string;
  verifiedCode: string;
  onCodeInvalid: () => void;
}

function AdminViewContent({ tenantId, tenantName, verifiedCode, onCodeInvalid }: AdminViewContentProps) {
  const { setTenant } = useTenant();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Umbenennen
  const [renameMode, setRenameMode] = useState(false);
  const [newName, setNewName] = useState(tenantName);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSuccess, setRenameSuccess] = useState(false);

  // Reset
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showResetGate, setShowResetGate] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Admin-Code ändern
  const [showCodeChangeForm, setShowCodeChangeForm] = useState(false);
  const [showCodeChangeGate, setShowCodeChangeGate] = useState(false);
  const [newCode1, setNewCode1] = useState('');
  const [newCode2, setNewCode2] = useState('');
  const [codeChangeError, setCodeChangeError] = useState<string | null>(null);
  const [codeChangeSuccess, setCodeChangeSuccess] = useState(false);
  const [pendingNewCode, setPendingNewCode] = useState('');

  // Neuer Tenant
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createAdminCode, setCreateAdminCode] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? '';

  const loadData = useCallback(async () => {
    try {
      const [tenantsRes] = await Promise.all([
        fetch(`${backendUrl}/api/tenants`),
      ]);
      if (tenantsRes.ok) {
        const data = await tenantsRes.json() as TenantInfo[];
        setTenants(data);
        const found = data.find(t => t.id === tenantId) ?? null;
        setCurrentTenant(found);
      }
    } catch {
      setLoadError('Daten konnten nicht geladen werden.');
    }
  }, [backendUrl, tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRename() {
    setRenameError(null);
    if (!newName.trim()) { setRenameError('Name darf nicht leer sein.'); return; }
    const res = await fetch(`${backendUrl}/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode: verifiedCode, name: newName.trim() }),
    });
    if (res.status === 401) { onCodeInvalid(); return; }
    if (res.status === 429) { setRenameError('Zu viele Versuche. Bitte warten.'); return; }
    if (!res.ok) { setRenameError('Fehler beim Umbenennen.'); return; }
    setRenameSuccess(true);
    setRenameMode(false);
    void loadData();
  }

  async function handleResetSubmit(code: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${backendUrl}/api/tenants/${tenantId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode: code }),
    });
    const body = await res.json() as { ok?: boolean; error?: string };
    if (res.ok) {
      setResetSuccess(true);
      setShowResetGate(false);
      setResetConfirmText('');
      setTimeout(() => window.location.reload(), 1500);
      return { ok: true };
    }
    if (res.status === 429) return { ok: false, error: 'Zu viele Versuche. Bitte warten.' };
    if (res.status === 401) return { ok: false, error: body.error ?? 'Falscher Code.' };
    return { ok: false, error: 'Fehler beim Reset.' };
  }

  function handleCodeChangeStart() {
    setCodeChangeError(null);
    if (!newCode1 || !newCode2) { setCodeChangeError('Bitte neuen Code zweimal eingeben.'); return; }
    if (newCode1 !== newCode2) { setCodeChangeError('Die neuen Codes stimmen nicht überein.'); return; }
    if (newCode1.length < 6) { setCodeChangeError('Code muss mindestens 6 Zeichen lang sein.'); return; }
    setPendingNewCode(newCode1);
    setShowCodeChangeGate(true);
  }

  async function handleCodeChangeSubmit(code: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`${backendUrl}/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode: code, newAdminCode: pendingNewCode }),
    });
    const body = await res.json() as { ok?: boolean; error?: string };
    if (res.ok) {
      setCodeChangeSuccess(true);
      setShowCodeChangeGate(false);
      setShowCodeChangeForm(false);
      setNewCode1('');
      setNewCode2('');
      clearStoredAdminCode();
      return { ok: true };
    }
    if (res.status === 429) return { ok: false, error: 'Zu viele Versuche. Bitte warten.' };
    if (res.status === 401) return { ok: false, error: body.error ?? 'Falscher Code.' };
    return { ok: false, error: 'Fehler beim Ändern des Codes.' };
  }

  async function handleCreateTenant() {
    setCreateError(null);
    if (!createId.trim() || !createName.trim() || !createAdminCode.trim()) {
      setCreateError('Alle Felder sind erforderlich.'); return;
    }
    if (createAdminCode.length < 6) { setCreateError('Admin-Code muss mindestens 6 Zeichen lang sein.'); return; }
    setCreating(true);
    try {
      const res = await fetch(`${backendUrl}/api/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createId.trim(), name: createName.trim(), adminCode: createAdminCode }),
      });
      const body = await res.json() as { id?: string; name?: string; error?: string };
      if (!res.ok) { setCreateError(body.error ?? 'Fehler beim Anlegen.'); return; }
      setShowCreateForm(false);
      setCreateId(''); setCreateName(''); setCreateAdminCode('');
      void loadData();
    } catch {
      setCreateError('Verbindungsfehler.');
    } finally {
      setCreating(false);
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-CH');
    } catch {
      return iso;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Titel */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-bund-blau" />
        <h2 className="text-xl font-bold text-gray-800">Admin-Bereich</h2>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{loadError}</div>
      )}

      {/* Sektion 1: Aktueller Train */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Aktueller Train</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-4">
            <span className="w-28 text-gray-500">Train-ID:</span>
            <span className="font-mono text-gray-800">{tenantId}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-28 text-gray-500">Train-Name:</span>
            {renameMode ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
                />
                <button onClick={handleRename} className="text-xs bg-bund-blau text-white px-3 py-1.5 rounded hover:bg-bund-blau/90">Speichern</button>
                <button onClick={() => setRenameMode(false)} className="text-xs text-gray-500 px-2 py-1.5">Abbrechen</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-800">{currentTenant?.name ?? tenantName}</span>
                <button onClick={() => { setRenameMode(true); setRenameSuccess(false); }} className="text-xs text-bund-blau underline">Umbenennen</button>
              </div>
            )}
          </div>
          {currentTenant && (
            <div className="flex items-center gap-4">
              <span className="w-28 text-gray-500">Erstellt:</span>
              <span className="text-gray-800">{formatDate(currentTenant.createdAt)}</span>
            </div>
          )}
        </div>
        {renameError && <p className="text-red-600 text-xs mt-2">{renameError}</p>}
        {renameSuccess && <p className="text-green-600 text-xs mt-2">Name erfolgreich geändert.</p>}
      </div>

      {/* Sektion 2: Weitere Trains */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Alle Trains</h3>
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5 text-sm text-bund-blau font-medium hover:underline"
          >
            <PlusCircle className="w-4 h-4" />
            Neuen Train anlegen
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-4 bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Neuer Train</h4>
            <input
              type="text"
              placeholder="Train-ID (z.B. ps-net)"
              value={createId}
              onChange={e => setCreateId(e.target.value.toLowerCase())}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
            />
            <input
              type="text"
              placeholder="Train-Name (z.B. PS-NET Train)"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
            />
            <input
              type="password"
              placeholder="Admin-Code (min. 6 Zeichen)"
              value={createAdminCode}
              onChange={e => setCreateAdminCode(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bund-blau"
            />
            {createError && <p className="text-red-600 text-xs">{createError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowCreateForm(false); setCreateError(null); }} className="text-sm text-gray-500 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">Abbrechen</button>
              <button onClick={handleCreateTenant} disabled={creating} className="text-sm bg-bund-blau text-white px-3 py-1.5 rounded hover:bg-bund-blau/90 disabled:opacity-50">
                {creating ? 'Anlegen...' : 'Anlegen'}
              </button>
            </div>
          </div>
        )}

        {tenants.length === 0 ? (
          <p className="text-sm text-gray-400">Keine Trains gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">ID</th>
                <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                <th className="text-left py-2 text-gray-500 font-medium">Erstellt</th>
                <th className="text-right py-2"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 font-mono text-gray-700">{t.id}</td>
                  <td className="py-2 text-gray-800">
                    {t.id === tenantId ? (
                      <span className="font-semibold">{t.name} <span className="text-xs text-bund-blau">(aktiv)</span></span>
                    ) : t.name}
                  </td>
                  <td className="py-2 text-gray-500">{formatDate(t.createdAt)}</td>
                  <td className="py-2 text-right">
                    {t.id !== tenantId && (
                      <button
                        onClick={() => setTenant(t.id, t.name)}
                        className="flex items-center gap-1 text-xs text-bund-blau hover:underline ml-auto"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Wechseln
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sektion 3: Gefährliche Aktionen */}
      <div className="bg-red-50 border border-red-300 rounded-lg p-6 space-y-6">
        <h3 className="text-base font-semibold text-red-800">Gefährliche Aktionen</h3>

        {/* Alle Daten löschen */}
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Alle Daten löschen
          </h4>
          <p className="text-xs text-red-600 mb-3">
            Setzt alle Planungsdaten dieses Trains auf den Ausgangszustand zurück. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>

          {resetSuccess ? (
            <p className="text-green-700 text-sm font-medium">State wurde zurückgesetzt. Seite wird neu geladen...</p>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-xs text-red-700 mb-1">
                  Tippen Sie <strong>LÖSCHEN</strong> zur Bestätigung:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={e => setResetConfirmText(e.target.value)}
                  placeholder="LÖSCHEN"
                  className="border border-red-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                />
              </div>
              {resetError && <p className="text-red-700 text-xs mb-2">{resetError}</p>}
              <button
                onClick={() => {
                  if (resetConfirmText !== 'LÖSCHEN') {
                    setResetError('Bitte "LÖSCHEN" eingeben um fortzufahren.');
                    return;
                  }
                  setResetError(null);
                  setShowResetGate(true);
                }}
                disabled={resetConfirmText !== 'LÖSCHEN'}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Alle Daten löschen
              </button>
            </>
          )}
        </div>

        <div className="border-t border-red-200" />

        {/* Admin-Code ändern */}
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Admin-Code ändern
          </h4>

          {codeChangeSuccess ? (
            <p className="text-green-700 text-sm font-medium">Admin-Code wurde erfolgreich geändert.</p>
          ) : !showCodeChangeForm ? (
            <button
              onClick={() => setShowCodeChangeForm(true)}
              className="text-sm text-red-700 underline"
            >
              Code ändern
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Neuer Code (min. 6 Zeichen)"
                value={newCode1}
                onChange={e => setNewCode1(e.target.value)}
                className="border border-red-300 rounded px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
              <input
                type="password"
                placeholder="Neuen Code bestätigen"
                value={newCode2}
                onChange={e => setNewCode2(e.target.value)}
                className="border border-red-300 rounded px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
              {codeChangeError && <p className="text-red-700 text-xs">{codeChangeError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowCodeChangeForm(false); setCodeChangeError(null); }} className="text-xs text-gray-500 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50">Abbrechen</button>
                <button onClick={handleCodeChangeStart} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">Weiter</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AdminGate für Reset */}
      {showResetGate && (
        <AdminGate
          onSubmit={handleResetSubmit}
          onCancel={() => setShowResetGate(false)}
        />
      )}

      {/* AdminGate für Code-Änderung */}
      {showCodeChangeGate && (
        <AdminGate
          onSubmit={handleCodeChangeSubmit}
          onCancel={() => setShowCodeChangeGate(false)}
        />
      )}
    </div>
  );
}
