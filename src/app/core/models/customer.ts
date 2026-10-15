export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  frequent: boolean;
  wholesale: boolean;
  creditEnabled: boolean;
  active: boolean;
}
