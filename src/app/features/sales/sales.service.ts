import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '@core/config/api.config';

import { Observable } from 'rxjs';

import { Sale } from '@core/models/sale';
import { SaleDetail } from '@core/models/sale-detail';

export interface AddSaleItemRequest {
  presentationId: string;
  quantity: number;
  unitPrice?: number;
}

export interface MoveSaleItemRequest {
  targetSaleId: string;
}

export interface SplitSaleItemRequest {
  targetSaleId: string;
  quantity: number;
}

export interface SalePaymentRequest {
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  amount: number;
}

export interface PaySaleRequest {
  payments: SalePaymentRequest[];
}

export interface CloseCreditSaleRequest {
  payments: SalePaymentRequest[];
}

export interface OpenSaleRequest {
  cashSessionId: string;
  reference?: string | null;
  customerId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly apiUrl = `${API_BASE_URL}/sales`;

  constructor(private readonly http: HttpClient) {}

  findOpen(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/open`);
  }

  findById(saleId: string): Observable<SaleDetail> {
    return this.http.get<SaleDetail>(`${this.apiUrl}/${saleId}`);
  }

  addItem(saleId: string, request: AddSaleItemRequest): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.apiUrl}/${saleId}/items`, request);
  }

  changeItemQuantity(saleId: string, itemId: string, quantity: number): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/quantity`, {
      quantity,
    });
  }

  changeItemPrice(saleId: string, itemId: string, unitPrice: number): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/price`, {
      unitPrice,
    });
  }

  removeItem(saleId: string, itemId: string): Observable<SaleDetail> {
    return this.http.delete<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}`);
  }

  moveItem(sourceSaleId: string, itemId: string, targetSaleId: string): Observable<SaleDetail> {
    const request: MoveSaleItemRequest = {
      targetSaleId,
    };

    return this.http.post<SaleDetail>(
      `${this.apiUrl}/${sourceSaleId}/items/${itemId}/move`,
      request,
    );
  }

  splitItem(
    sourceSaleId: string,
    itemId: string,
    targetSaleId: string,
    quantity: number,
  ): Observable<SaleDetail> {
    const request: SplitSaleItemRequest = {
      targetSaleId,
      quantity,
    };

    return this.http.post<SaleDetail>(
      `${this.apiUrl}/${sourceSaleId}/items/${itemId}/split`,
      request,
    );
  }

  applyItemDiscount(
    saleId: string,
    itemId: string,
    discountType: 'AMOUNT' | 'PERCENT',
    discountValue: number,
  ): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/discount`, {
      discountType,
      discountValue,
    });
  }

  removeItemDiscount(saleId: string, itemId: string): Observable<SaleDetail> {
    return this.http.delete<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/discount`);
  }

  markItemCourtesy(saleId: string, itemId: string): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/courtesy`, {});
  }

  removeItemCourtesy(saleId: string, itemId: string): Observable<SaleDetail> {
    return this.http.delete<SaleDetail>(`${this.apiUrl}/${saleId}/items/${itemId}/courtesy`);
  }

  applySaleDiscount(
    saleId: string,
    discountType: 'AMOUNT' | 'PERCENT',
    discountValue: number,
  ): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/discount`, {
      discountType,
      discountValue,
    });
  }

  removeSaleDiscount(saleId: string): Observable<SaleDetail> {
    return this.http.delete<SaleDetail>(`${this.apiUrl}/${saleId}/discount`);
  }

  paySale(saleId: string, request: PaySaleRequest): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.apiUrl}/${saleId}/pay`, request);
  }

  assignCustomer(saleId: string, customerId: string): Observable<SaleDetail> {
    return this.http.patch<SaleDetail>(`${this.apiUrl}/${saleId}/customer`, {
      customerId,
    });
  }

  removeCustomer(saleId: string): Observable<SaleDetail> {
    return this.http.delete<SaleDetail>(`${this.apiUrl}/${saleId}/customer`);
  }

  closeAsCredit(saleId: string, request: CloseCreditSaleRequest): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.apiUrl}/${saleId}/credit`, request);
  }

  cancelSale(saleId: string, reason: string): Observable<SaleDetail> {
    return this.http.post<SaleDetail>(`${this.apiUrl}/${saleId}/cancel`, {
      reason,
    });
  }

  openSale(request: OpenSaleRequest): Observable<Sale> {
    return this.http.post<Sale>(`${this.apiUrl}/open`, request);
  }
}
