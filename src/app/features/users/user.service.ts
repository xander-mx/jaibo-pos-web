import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/config/api.config';

import { User } from '@core/models/user';

export interface CreateUserRequest {
  username: string;
  password: string;
  displayName: string;
  role: 'ADMIN' | 'CASHIER';
}

export interface ResetPasswordRequest {
  newPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${API_BASE_URL}/users`;

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  create(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  activate(userId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/activate`, {});
  }

  deactivate(userId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/deactivate`, {});
  }

  resetPassword(userId: string, request: ResetPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${userId}/password`, request);
  }
}
