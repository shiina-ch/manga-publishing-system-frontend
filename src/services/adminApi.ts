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

export interface ApiError {
  code: number;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
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
 * Xóa token và account khỏi localStorage.
 */
export function logout(): void {
  tokenStorage.clear();
}

// ─── Admin API (ví dụ, thêm sau) ─────────────────────────────────────────────

/**
 * GET /api/admin/accounts  (ví dụ — cần token)
 */
export async function getAccounts() {
  const res = await fetch(`${BASE_URL}/admin/accounts`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}
