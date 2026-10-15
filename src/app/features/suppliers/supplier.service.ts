import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@core/config/api.config';
import { Supplier } from '@core/models/supplier';

export interface CreateSupplierRequest {
  name: string;
  phone?: string | null;
}

export interface UpdateSupplierRequest {
  name: string;
  phone?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly apiUrl = `${API_BASE_URL}/suppliers`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl);
  }

  create(request: CreateSupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, request);
  }

  update(supplierId: string, request: UpdateSupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${supplierId}`, request);
  }

  activate(supplierId: string): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.apiUrl}/${supplierId}/activate`, {});
  }

  deactivate(supplierId: string): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.apiUrl}/${supplierId}/deactivate`, {});
  }
}
