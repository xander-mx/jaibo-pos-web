export interface SaleItem {
  id: string;
  productId: string;
  presentationId: string;

  productName: string;
  presentationName: string;

  unitCode: string;
  unitSymbol: string;

  quantity: number;
  conversionFactor: number;

  unitPrice: number;
  priceBasisQuantity: number;

  grossAmount: number;

  discountType: string;
  discountValue: number;
  discountAmount: number;

  courtesy: boolean;
  lineTotal: number;

  createdByUserId: string;
  createdFromTerminalId: string;

  version: number;
}
