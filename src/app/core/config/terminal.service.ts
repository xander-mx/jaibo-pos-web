import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/config/api.config';

export interface CurrentTerminal {
  terminalId: string;
  terminalName: string;
  branchId: string;
  branchName: string;
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
}
