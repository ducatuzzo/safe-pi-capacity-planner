// Hook für Tenant-Auswahl und -Verwaltung
// sessionStorage-Key: 'pi-planner-tenant'
// Format: JSON { tenantId: string, tenantName: string }

const SESSION_KEY = 'pi-planner-tenant';

interface TenantSession {
  tenantId: string;
  tenantName: string;
}

function readSession(): TenantSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenantSession;
  } catch {
    return null;
  }
}

export function useTenant(): {
  tenantId: string | null;
  tenantName: string;
  setTenant: (id: string, name: string) => void;
  clearTenant: () => void;
} {
  const session = readSession();

  function setTenant(id: string, name: string): void {
    const data: TenantSession = { tenantId: id, tenantName: name };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    window.location.reload();
  }

  function clearTenant(): void {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  return {
    tenantId: session?.tenantId ?? null,
    tenantName: session?.tenantName ?? '',
    setTenant,
    clearTenant,
  };
}
