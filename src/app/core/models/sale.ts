export interface Sale {
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

  openedByUserId: string;
  openedFromTerminalId: string;

  createdAt: string;
  version: number;
}
