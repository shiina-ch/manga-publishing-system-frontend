export const PUBLIC_REQUESTED_ROLES = [
  "MANAGER",
  "TANTOU_EDITOR",
  "EDITORIAL_BOARD_MEMBER",
  "MANGAKA",
  "ASSISTANT",
] as const;

export type PublicRequestedRole = (typeof PUBLIC_REQUESTED_ROLES)[number];

export const ACTIVE_ROLES = ["ADMIN", ...PUBLIC_REQUESTED_ROLES] as const;

export type ActiveRole = (typeof ACTIVE_ROLES)[number];

export const PUBLIC_REQUESTED_ROLE_LABELS: Record<PublicRequestedRole, string> = {
  MANAGER: "Manager",
  TANTOU_EDITOR: "Tantou Editor",
  EDITORIAL_BOARD_MEMBER: "Editorial Board Member",
  MANGAKA: "Mangaka",
  ASSISTANT: "Assistant",
};

export const PUBLIC_REQUESTED_ROLE_OPTIONS = PUBLIC_REQUESTED_ROLES.map((value) => ({
  value,
  label: PUBLIC_REQUESTED_ROLE_LABELS[value],
}));

export const ACCOUNT_STATUSES = ["PENDING", "ACTIVE", "REJECTED", "INACTIVE"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface AccountResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  requestedRole: PublicRequestedRole | null;
  status: AccountStatus;
  approvedById: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  rejectedById: number | null;
  rejectedAt: string | null;
}

export interface RegistrationRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  requestedRole: PublicRequestedRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  account: AccountResponse;
}

export interface RegistrationResponseData {
  account: AccountResponse;
}

export interface LoginResponse {
  code: 200;
  message: string;
  data: LoginResponseData;
}

export interface RegistrationResponse {
  code: 201;
  message: string;
  data: RegistrationResponseData;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  errorCode: string;
  details: Record<string, unknown> | null;
}

export function isPublicRequestedRole(value: string): value is PublicRequestedRole {
  return PUBLIC_REQUESTED_ROLES.some((role) => role === value);
}

export function isActiveRole(value: string): value is ActiveRole {
  return ACTIVE_ROLES.some((role) => role === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isAccountResponse(value: unknown): value is AccountResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number"
    && typeof value.firstName === "string"
    && typeof value.lastName === "string"
    && typeof value.email === "string"
    && typeof value.phoneNumber === "string"
    && (value.requestedRole === null || (typeof value.requestedRole === "string" && isPublicRequestedRole(value.requestedRole)))
    && typeof value.status === "string"
    && ACCOUNT_STATUSES.some((status) => status === value.status)
    && isNullableNumber(value.approvedById)
    && isNullableString(value.approvedAt)
    && isNullableString(value.rejectionReason)
    && isNullableNumber(value.rejectedById)
    && isNullableString(value.rejectedAt)
  );
}
