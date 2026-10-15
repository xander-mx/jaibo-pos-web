import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/config/api.config';
import { Category } from '@core/models/category';
import { Product } from '@core/models/product';
import { ProductPresentation } from '@core/models/product-presentation';
import { Unit } from '@core/models/unit';

export interface CreateCategoryRequest {
  name: string;
  displayOrder?: number | null;
}

export interface CreateProductRequest {
  categoryId: string;
  inventoryUnitId?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  inventoryMode: InventoryMode;
  sellable: boolean;
  purchasable: boolean;
  displayOrder?: number | null;
}

export interface CreateProductPresentationRequest {
  unitId: string;
  name: string;
  conversionFactor: number;
  salePrice?: number | null;
  priceBasisQuantity: number;
  variableQuantity: boolean;
  minimumQuantity?: number | null;
  openPrice: boolean;
  displayOrder?: number | null;
}

export type InventoryMode = 'DIRECT' | 'MANUAL_AT_CLOSE' | 'NOT_TRACKED';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  constructor(private readonly http: HttpClient) {}

  findCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${API_BASE_URL}/categories`);
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${API_BASE_URL}/categories`, request);
  }

  findUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${API_BASE_URL}/units`);
  }

  findProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_BASE_URL}/products`);
  }

  findSellableProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_BASE_URL}/products?sellableOnly=true`);
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${API_BASE_URL}/products`, request);
  }

  findPresentations(productId: string): Observable<ProductPresentation[]> {
    return this.http.get<ProductPresentation[]>(
      `${API_BASE_URL}/products/${productId}/presentations`,
    );
  }

  createPresentation(
    productId: string,
    request: CreateProductPresentationRequest,
  ): Observable<ProductPresentation> {
    return this.http.post<ProductPresentation>(
      `${API_BASE_URL}/products/${productId}/presentations`,
      request,
    );
  }
}
