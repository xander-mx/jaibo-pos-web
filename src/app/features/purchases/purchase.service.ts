import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Purchase } from '@core/models/purchase';
import { PurchaseDetail } from '@core/models/purchase-detail';
import { PurchasePayment } from '@core/models/purchase-payment';

export interface CreatePurchaseRequest {
  supplierId?: string | null;
  note?: string | null;
}

export interface AddPurchaseItemRequest {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface RegisterPurchasePaymentRequest {
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  paymentSource: 'CASH_REGISTER' | 'EXTERNAL';
  amount: number;
}

export interface PurchaseFilters {
  status?: 'DRAFT' | 'RECEIVED' | 'CANCELLED' | null;
  paymentStatus?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | null;
  supplierId?: string | null;
  pendingOnly?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private readonly apiUrl = `${environment.apiBaseUrl}/purchases`;

  constructor(private readonly http: HttpClient) {}

  findAll(filters?: PurchaseFilters): Observable<Purchase[]> {
    let params = new HttpParams();

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.paymentStatus) {
      params = params.set('paymentStatus', filters.paymentStatus);
    }

    if (filters?.supplierId) {
      params = params.set('supplierId', filters.supplierId);
    }

    if (filters?.pendingOnly) {
      params = params.set('pendingOnly', 'true');
    }

    return this.http.get<Purchase[]>(this.apiUrl, { params });
  }

  create(request: CreatePurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(this.apiUrl, request);
  }

  findById(purchaseId: string): Observable<PurchaseDetail> {
    return this.http.get<PurchaseDetail>(`${this.apiUrl}/${purchaseId}`);
  }

  addItem(purchaseId: string, request: AddPurchaseItemRequest): Observable<PurchaseDetail> {
    return this.http.post<PurchaseDetail>(`${this.apiUrl}/${purchaseId}/items`, request);
  }

  removeItem(purchaseId: string, itemId: string): Observable<PurchaseDetail> {
    return this.http.delete<PurchaseDetail>(`${this.apiUrl}/${purchaseId}/items/${itemId}`);
  }

  receive(purchaseId: string): Observable<PurchaseDetail> {
    return this.http.post<PurchaseDetail>(`${this.apiUrl}/${purchaseId}/receive`, {});
  }

  registerPayment(
    purchaseId: string,
    request: RegisterPurchasePaymentRequest,
  ): Observable<PurchasePayment> {
    return this.http.post<PurchasePayment>(`${this.apiUrl}/${purchaseId}/payments`, request);
  }
}
