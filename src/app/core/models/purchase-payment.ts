export type PurchasePaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

export type PurchasePaymentSource = 'CASH_REGISTER' | 'EXTERNAL';

export interface PurchasePayment {
  id: string;
  purchaseId: string;

  paymentMethod: PurchasePaymentMethod;
  paymentSource: PurchasePaymentSource;

  amount: number;
  paidAt: string;
}
