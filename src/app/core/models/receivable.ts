export interface Receivable {
  id: string;
  saleId: string;
  saleNumber: number;
  originalAmount: number;
  balance: number;
  status: 'OPEN' | 'PAID';
  openedAt: string;
  paidAt: string | null;
}
