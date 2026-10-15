import { Unit } from './unit';

export interface ProductPresentation {
  id: string;
  productId: string;
  name: string;
  unit: Unit;
  conversionFactor: number;
  salePrice: number | null;
  priceBasisQuantity: number;
  variableQuantity: boolean;
  minimumQuantity: number | null;
  openPrice: boolean;
  displayOrder: number;
  active: boolean;
}
