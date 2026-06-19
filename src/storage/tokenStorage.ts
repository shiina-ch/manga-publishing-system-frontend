const TOKEN_KEY = "mangaflow_token";
const ACCOUNT_KEY = "mangaflow_account";

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

  getAccount(): Account | null {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Account;
    } catch {
      return null;
    }
  },

  setAccount(account: Account): void {
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
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// Types matching the API response
export interface SystemRole {
  id: number;
  roleName: string;
}

export interface Account {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  systemRole: SystemRole[];
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  enabled: boolean;
  requestedRole: string | null;
  status: string;
  username: string;
}
