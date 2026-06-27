import { tokenStorage } from "../storage/tokenStorage";
import type {
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  RegistrationRequest,
  RegistrationResponse,
  RegistrationResponseData,
} from "../types/account";
import { isAccountResponse } from "../types/account";
import { API_BASE_URL } from "./api";

export interface AdminAccount {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  requestedRole: string | null;
  status: string;
  approvedAt?: string | null;
  systemRole?: Array<{ roleName: string }>;
}

interface AccountListResponse {
  code: number;
  message: string;
  data: AdminAccount[];
}

export class ApiRequestError extends Error implements ApiErrorResponse {
  status: number;
  error: string;
  timestamp: string;
  path: string;
  errorCode: string;
  details: Record<string, unknown> | null;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiRequestError";
    this.status = response.status;
    this.error = response.error;
    this.timestamp = response.timestamp;
    this.path = response.path;
    this.errorCode = response.errorCode;
    this.details = response.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown> | null, key: string, fallback: string): string {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readDetails(record: Record<string, unknown> | null): Record<string, unknown> | null {
  const details = record?.details;
  return isRecord(details) ? details : null;
}

async function parseResponseBody(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const text = await res.text();
    if (!text.trim()) return null;
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createResponseError(res: Response, body: Record<string, unknown> | null): ApiRequestError {
  return new ApiRequestError({
    status: typeof body?.status === "number" ? body.status : res.status,
    message: readString(body, "message", "Unable to process the request. Please try again."),
    error: readString(body, "error", res.statusText || "Request failed"),
    timestamp: readString(body, "timestamp", new Date().toISOString()),
    path: readString(body, "path", res.url),
    errorCode: readString(body, "errorCode", "UNKNOWN_ERROR"),
    details: readDetails(body),
  });
}

export function createInvalidResponseError(res: Response): ApiRequestError {
  return new ApiRequestError({
    status: res.status,
    message: "The server returned an invalid response. Please try again.",
    error: "Invalid response",
    timestamp: new Date().toISOString(),
    path: res.url,
    errorCode: "INVALID_RESPONSE",
    details: null,
  });
}

export async function parseApiResponse<T>(res: Response, successCodes = [200, 201]): Promise<T> {
  const body = await parseResponseBody(res);
  const responseCode = typeof body?.code === "number" ? body.code : res.status;

  if (!res.ok || !successCodes.includes(responseCode)) {
    throw createResponseError(res, body);
  }

  if (!body) {
    throw createInvalidResponseError(res);
  }

  return body as T;
}

export function getAuthHeaders(): HeadersInit {
  const token = tokenStorage.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  return typeof value.data.token === "string" && value.data.token.length > 0 && isAccountResponse(value.data.account);
}

function isRegistrationResponse(value: unknown): value is RegistrationResponse {
  return isRecord(value) && isRecord(value.data) && isAccountResponse(value.data.account);
}

export async function login(credentials: LoginRequest): Promise<LoginResponseData> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const response = await parseApiResponse<unknown>(res, [200]);
  if (!isLoginResponse(response)) throw createInvalidResponseError(res);
  tokenStorage.setToken(response.data.token);
  tokenStorage.setAccount(response.data.account);
  return response.data;
}

export async function registerAccount(payload: RegistrationRequest): Promise<RegistrationResponseData> {
  const res = await fetch(`${API_BASE_URL}/auth/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const response = await parseApiResponse<unknown>(res, [201]);
  if (!isRegistrationResponse(response)) throw createInvalidResponseError(res);
  return response.data;
}

export function logout(): void {
  tokenStorage.clear();
}

export async function getAllAccounts(): Promise<AdminAccount[]> {
  const res = await fetch(`${API_BASE_URL}/admin/accounts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const response = await parseApiResponse<AccountListResponse>(res);
  return response.data;
}

export async function approveAccount(accountId: number, roleName: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/admin/accounts/${accountId}/approve?roleName=${roleName.toLowerCase()}`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  await parseApiResponse<unknown>(res);
}

export async function activateAccount(accountId: number): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/admin/accounts/${accountId}/activate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  await parseApiResponse<unknown>(res);
}

export async function deactivateAccount(accountId: number): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/admin/accounts/${accountId}/deactivate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  await parseApiResponse<unknown>(res);
}
