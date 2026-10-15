export interface CreditPayment {
  id: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  amount: number;
  receivedAt: string;
}
