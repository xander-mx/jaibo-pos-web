import { Unit } from './unit';

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  inventoryMode: string;
  sellable: boolean;
  purchasable: boolean;
  displayOrder: number;
  active: boolean;
  category: ProductCategory;
  inventoryUnit: Unit | null;
}
