import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/config/api.config';

import { InventoryItem } from '@core/models/inventory';

export interface AdjustInventoryRequest {
  quantity: number;
  reason?: string | null;
}

export interface RegisterWasteRequest {
  quantity: number;
  reason?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = `${API_BASE_URL}/inventory`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(this.apiUrl);
  }

  adjustQuantity(productId: string, request: AdjustInventoryRequest): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(`${this.apiUrl}/${productId}/quantity`, request);
  }

  registerWaste(productId: string, request: RegisterWasteRequest): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/${productId}/waste`, request);
  }
}
