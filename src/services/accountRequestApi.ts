import {
  isAccountResponse,
  type AccountResponse,
  type AccountStatus,
} from "../types/account";
import {
  ApiRequestError,
  createInvalidResponseError,
  getAuthHeaders,
  parseApiResponse,
} from "./adminApi";
import { API_BASE_URL } from "./api";

interface AccountRequestListResponse {
  code: number;
  message: string;
  data: AccountResponse[];
}

interface AccountRequestMutationResponse {
  code: number;
  message: string;
  data: AccountResponse;
}

function validateAccountList(response: AccountRequestListResponse, res: Response): AccountResponse[] {
  if (!Array.isArray(response.data) || !response.data.every(isAccountResponse)) {
    throw createInvalidResponseError(res);
  }
  return response.data;
}

function validateAccount(response: AccountRequestMutationResponse, res: Response): AccountResponse {
  if (!isAccountResponse(response.data)) throw createInvalidResponseError(res);
  return response.data;
}

export async function getAccountRequests(status?: AccountStatus): Promise<AccountResponse[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE_URL}/account-requests${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const response = await parseApiResponse<AccountRequestListResponse>(res, [200]);
  return validateAccountList(response, res);
}

export async function approveAccountRequest(accountId: number): Promise<AccountResponse> {
  const res = await fetch(`${API_BASE_URL}/account-requests/${accountId}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const response = await parseApiResponse<AccountRequestMutationResponse>(res, [200]);
  return validateAccount(response, res);
}

export async function rejectAccountRequest(accountId: number, reason: string): Promise<AccountResponse> {
  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length > 1000) {
    throw new ApiRequestError({
      status: 400,
      message: !trimmedReason ? "Rejection reason is required" : "Rejection reason must not exceed 1000 characters",
      error: "Validation error",
      timestamp: new Date().toISOString(),
      path: `/account-requests/${accountId}/reject`,
      errorCode: "VALIDATION_ERROR",
      details: { reason: !trimmedReason ? "Required" : "Maximum length is 1000 characters" },
    });
  }
  const res = await fetch(`${API_BASE_URL}/account-requests/${accountId}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason: trimmedReason }),
  });
  const response = await parseApiResponse<AccountRequestMutationResponse>(res, [200]);
  return validateAccount(response, res);
}
