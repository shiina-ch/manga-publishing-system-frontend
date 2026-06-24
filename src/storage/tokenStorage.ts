import type { AccountResponse, ActiveRole } from "../types/account";
import { isAccountResponse, isActiveRole } from "../types/account";

const TOKEN_KEY = "mangaflow_token";
const ACCOUNT_KEY = "mangaflow_account";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segments = token.split(".");
    if (segments.length !== 3 || segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) {
      return null;
    }

    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const remainder = base64.length % 4;
    if (remainder === 1) return null;
    const padded = base64.padEnd(base64.length + ((4 - remainder) % 4), "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function rolesFromToken(token: string | null): ActiveRole[] {
  if (!token) return [];
  const payload = decodeJwtPayload(token);
  if (!payload || !Array.isArray(payload.roles)) return [];

  const expiresAt = payload.exp;
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return [];
  if (expiresAt <= Date.now() / 1000) return [];

  const roles = payload.roles.filter(
    (role): role is ActiveRole => typeof role === "string" && isActiveRole(role),
  );
  return [...new Set(roles)];
}

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getAccount(): AccountResponse | null {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isAccountResponse(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  setAccount(account: AccountResponse): void {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  },

  removeAccount(): void {
    localStorage.removeItem(ACCOUNT_KEY);
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACCOUNT_KEY);
  },

  isAuthenticated(): boolean {
    return this.getRoles().length > 0 && this.getAccount() !== null;
  },

  getRoles(): ActiveRole[] {
    return rolesFromToken(this.getToken());
  },

  hasRole(role: ActiveRole): boolean {
    return this.getRoles().includes(role);
  },
};
