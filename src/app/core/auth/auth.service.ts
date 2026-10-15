import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { RealtimeService } from '../realtime/realtime.service';
import { API_BASE_URL } from '@core/config/api.config';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  expiresAt?: string;
  expiresInSeconds?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'JAIBO_TOKEN';
  private readonly apiBaseUrl = `${API_BASE_URL}`;
  private readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly authenticated = signal(this.token() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly realtimeService: RealtimeService,
  ) {}

  login(username: string, password: string) {
    const request: LoginRequest = {
      username,
      password,
    };

    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, request).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.accessToken);

        this.token.set(response.accessToken);
        this.authenticated.set(true);
      }),
    );
  }

  getToken(): string | null {
    return this.token();
  }

  logout(): void {
    this.realtimeService.disconnect();

    localStorage.removeItem(this.tokenKey);

    this.token.set(null);
    this.authenticated.set(false);
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  getRole(): 'ADMIN' | 'CASHIER' | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      const roles = payload.roles;

      if (!Array.isArray(roles)) {
        return null;
      }

      if (roles.includes('ADMIN')) {
        return 'ADMIN';
      }

      if (roles.includes('CASHIER')) {
        return 'CASHIER';
      }

      return null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }
}
