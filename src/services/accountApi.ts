import { tokenStorage } from "../storage/tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8386/api";

function authHeaders(): HeadersInit {
  const token = tokenStorage.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AccountProfile {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: string;
  approvedAt?: string;
}

export interface AccountResponse {
  code: number;
  message: string;
  data: AccountProfile;
}

export async function getAccountProfile(accountId: number): Promise<AccountProfile> {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  
  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || "Lỗi khi lấy thông tin tài khoản");
  }
  
  return json.data;
}

export async function getAccounts(): Promise<AccountProfile[]> {
  const res = await fetch(`${BASE_URL}/accounts`, {
    method: "GET",
    headers: authHeaders(),
  });

  const json = await res.json();
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || "Failed to fetch accounts");
  }

  return json.data;
}

export async function searchAccountByEmail(email: string): Promise<AccountProfile> {
  const query = email.trim().toLowerCase();
  if (!query) {
    throw new Error("Email search term is empty");
  }

  try {
    const res = await fetch(`${BASE_URL}/accounts/search?email=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.code === 200 && json.data) {
        const found = Array.isArray(json.data) ? json.data[0] : json.data;
        if (found && found.id) {
          return found;
        }
      }
    }
  } catch {
    // Fall back to querying all accounts
  }

  const accounts = await getAccounts();
  const match = accounts.find((acc) => acc.email?.toLowerCase() === query);
  if (!match) {
    throw new Error(`No account found with email: ${email}`);
  }
  return match;
}

