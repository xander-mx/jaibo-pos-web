import { SaleItem } from './sale-item';

export interface SaleDetail {
  id: string;
  cashSessionId: string;
  branchId: string;

  saleNumber: number;
  reference: string | null;
  customerId: string | null;

  status: string;

  subtotal: number;
  lineDiscountTotal: number;
  courtesyTotal: number;
  saleDiscountAmount: number;
  total: number;

  items: SaleItem[];

  openedByUserId: string;
  openedFromTerminalId: string;

  saleDiscountType: string;
  saleDiscountValue: number;

  createdAt: string;
  version: number;
}
