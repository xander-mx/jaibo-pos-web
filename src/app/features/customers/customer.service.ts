import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/config/api.config';

import { Customer } from '@core/models/customer';
import { Receivable } from '@core/models/receivable';
import { CreditPayment } from '@core/models/credit-payment';

export interface AutomaticCreditPaymentRequest {
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  amount: number;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string | null;
  email?: string | null;
  frequent: boolean;
  wholesale: boolean;
  creditEnabled: boolean;
}

export interface UpdateCustomerRequest {
  name: string;
  phone?: string | null;
  email?: string | null;
  frequent: boolean;
  wholesale: boolean;
  creditEnabled: boolean;
}

export interface CreditPaymentRequest {
  receivableId: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  amount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly apiUrl = `${API_BASE_URL}/customers`;

  constructor(private readonly http: HttpClient) {}

  findActive(search?: string): Observable<Customer[]> {
    let params = new HttpParams();

    if (search && search.trim()) {
      params = params.set('q', search.trim());
    }

    return this.http.get<Customer[]>(this.apiUrl, { params });
  }

  findOpenReceivables(customerId: string): Observable<Receivable[]> {
    return this.http.get<Receivable[]>(`${this.apiUrl}/${customerId}/receivables`);
  }

  applyAutomaticCreditPayment(
    customerId: string,
    request: AutomaticCreditPaymentRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${customerId}/credit-payments/automatic`, request);
  }

  create(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, request);
  }

  update(customerId: string, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${customerId}`, request);
  }

  findCreditPayments(customerId: string): Observable<CreditPayment[]> {
    return this.http.get<CreditPayment[]>(`${this.apiUrl}/${customerId}/credit-payments`);
  }

  findPaidReceivables(customerId: string): Observable<Receivable[]> {
    return this.http.get<Receivable[]>(`${this.apiUrl}/${customerId}/receivables/paid`);
  }

  applyCreditPayment(customerId: string, request: CreditPaymentRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${customerId}/credit-payments`, request);
  }
}
