import { tokenStorage, type Account } from "../storage/tokenStorage";

const BASE_URL = "http://localhost:8386/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    account: Account;
    token: string;
  };
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  requestedRole: string;
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: {
    account: Account;
  };
}

export interface AdminAccount {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  requestedRole: string | null;
  status: string;
}

export interface ApiError {
  code: number;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || (json.code !== 200 && json.code !== 201)) {
    const err: ApiError = { code: json.code ?? res.status, message: json.message ?? "Đã xảy ra lỗi" };
    throw err;
  }
  return json as T;
}

function authHeaders(): HeadersInit {
  const token = tokenStorage.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Lưu token và thông tin account vào localStorage sau khi đăng nhập thành công.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse["data"]> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await handleResponse<LoginResponse>(res);

  // Persist to localStorage
  tokenStorage.setToken(data.data.token);
  tokenStorage.setAccount(data.data.account);

  return data.data;
}

/**
 * POST /api/auth/accounts
 * Đăng ký tài khoản mới.
 */
export async function registerAccount(payload: RegisterRequest): Promise<RegisterResponse["data"]> {
  const res = await fetch(`${BASE_URL}/auth/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<RegisterResponse>(res);
  return data.data;
}

/**
 * Xóa token và account khỏi localStorage.
 */
export function logout(): void {
  tokenStorage.clear();
}

// ─── Admin API ─────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/accounts — lấy danh sách tất cả tài khoản (cần token)
 */
export async function getAllAccounts(): Promise<AdminAccount[]> {
  const res = await fetch(`${BASE_URL}/admin/accounts`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await handleResponse<{ code: number; message: string; data: any[] }>(res);
  // Chỉ trả về các trường cần thiết
  return (json as any).data.map((acc: any) => ({
    id: acc.id,
    firstName: acc.firstName,
    lastName: acc.lastName,
    phoneNumber: acc.phoneNumber,
    email: acc.email,
    requestedRole: acc.requestedRole,
    status: acc.status,
  }));
}

/**
 * POST /api/admin/accounts/{id}/approve?roleName=...
 * Duyệt tài khoản và gán quyền
 */
export async function approveAccount(accountId: number, roleName: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/admin/accounts/${accountId}/approve?roleName=${roleName.toLowerCase()}`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );
  await handleResponse(res);
}

