export type UserRole = 'ADMIN' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}
