import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/config/api.config';

export interface CurrentTerminal {
  terminalId: string;
  terminalName: string;
  branchId: string;
  branchName: string;
}

export interface Terminal {
  id: string;
  branchId: string;
  name: string;
  active: boolean;
  registeredByUserId: string;
  registeredByName: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface RegisterTerminalRequest {
  name: string;
  branchId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TerminalService {
  private readonly terminalKey = 'JAIBO_TERMINAL_ID';
  private readonly http = inject(HttpClient);

  getTerminalId(): string | null {
    return localStorage.getItem(this.terminalKey);
  }

  setTerminalId(terminalId: string): void {
    localStorage.setItem(this.terminalKey, terminalId);
  }

  clear(): void {
    localStorage.removeItem(this.terminalKey);
  }

  getCurrent() {
    return this.http.get<CurrentTerminal>(`${API_BASE_URL}/terminals/current`);
  }

  findAll() {
    return this.http.get<Terminal[]>(`${API_BASE_URL}/terminals`);
  }

  register(request: RegisterTerminalRequest) {
    return this.http.post<Terminal>(`${API_BASE_URL}/terminals`, request);
  }
}
