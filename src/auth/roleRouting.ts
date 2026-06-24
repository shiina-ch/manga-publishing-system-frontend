import type { ActiveRole } from "../types/account";

export const ROLE_ROUTE_MAP: Record<ActiveRole, string> = {
  ADMIN: "/admin",
  MANAGER: "/account-requests",
  TANTOU_EDITOR: "/editor",
  EDITORIAL_BOARD_MEMBER: "/board/voting",
  MANGAKA: "/mangaka",
  ASSISTANT: "/assistant",
};

export const ROLE_PRIORITY: readonly ActiveRole[] = [
  "ADMIN",
  "MANAGER",
  "TANTOU_EDITOR",
  "EDITORIAL_BOARD_MEMBER",
  "MANGAKA",
  "ASSISTANT",
];

export function getPrimaryRole(roles: ActiveRole[]): ActiveRole | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

export function getDefaultRoute(roles: ActiveRole[]): string {
  const primaryRole = getPrimaryRole(roles);
  return primaryRole ? ROLE_ROUTE_MAP[primaryRole] : "/";
}
