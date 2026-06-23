import { tokenStorage } from "../storage/tokenStorage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8386/api";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface ApiError {
  code: number;
  message: string;
}

function authHeaders(includeJson = true): HeadersInit {
  const token = tokenStorage.getToken();
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  successCodes = [200, 201]
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(!(options.body instanceof FormData)),
      ...options.headers,
    },
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const responseCode = json?.code ?? res.status;
  if (!res.ok || !successCodes.includes(responseCode)) {
    const err: ApiError = {
      code: responseCode,
      message: json?.message || res.statusText || "Request failed",
    };
    throw err;
  }

  return json?.data as T;
}

export function normalizeStatus(status?: string | null): string {
  return (status || "pending").toLowerCase().replace(/\s+/g, "_");
}

export function formatDateLabel(value?: string | null): string {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
