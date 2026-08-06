export type UserRole = 'StoreManager' | 'RegionalManager';

export interface AuthUser {
  userId: number;
  username: string;
  displayName: string;
  role: UserRole;
  storeId: number | null;
  storeName: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
