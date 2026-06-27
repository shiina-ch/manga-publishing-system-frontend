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
