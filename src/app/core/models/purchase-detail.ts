import { PurchasePaymentStatus, PurchaseStatus } from './purchase';

import { PurchaseItem } from './purchase-item';
import { PurchasePayment } from './purchase-payment';

export interface PurchaseDetail {
  id: string;

  status: PurchaseStatus;

  supplierId: string | null;
  supplierName: string | null;

  total: number;
  paidAmount: number;
  pendingBalance: number;

  paymentStatus: PurchasePaymentStatus;

  note: string | null;

  createdAt: string;
  receivedAt: string | null;

  items: PurchaseItem[];
  payments: PurchasePayment[];
}
