export type PurchaseStatus = 'DRAFT' | 'RECEIVED' | 'CANCELLED';

export type PurchasePaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

export interface Purchase {
  id: string;

  supplierId: string | null;
  supplierName: string | null;

  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;

  total: number;
  paidAmount: number;
  pendingBalance: number;

  createdAt: string;
  receivedAt: string | null;
}
