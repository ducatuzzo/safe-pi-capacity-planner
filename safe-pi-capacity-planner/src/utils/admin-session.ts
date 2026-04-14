// Gemeinsame Helpers für den Admin-Code-Cache (sessionStorage)
// Genutzt von AdminGate.tsx (Lesen/Schreiben) und useTenant.ts (Invalidieren bei Train-Wechsel)

const SESSION_KEY = 'pi-planner-admin-code';
const CODE_TTL_MS = 15 * 60 * 1000; // 15 Minuten

interface StoredCode {
  code: string;
  expiresAt: number;
}

export function getStoredAdminCode(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredCode;
    if (Date.now() > stored.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return stored.code;
  } catch {
    return null;
  }
}

export function storeAdminCode(code: string): void {
  const data: StoredCode = { code, expiresAt: Date.now() + CODE_TTL_MS };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearStoredAdminCode(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
