import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/config/api.config';

export interface CashMovementTypeSummary {
  type: string;
  direction: 'IN' | 'OUT';
  total: number;
}

export interface CashMovementSummary {
  cashSessionId: string;
  openingAmount: number;
  incomeTotal: number;
  outcomeTotal: number;
  expectedAmount: number;
  movements: CashMovementTypeSummary[];
}

export interface CashSession {
  id: string;
  operatingCycleId: string;

  cycleStartsOn: string;
  cycleEndsOn: string;
  businessDate: string;

  status: string;

  openingAmount: number;
  openedAt: string;

  openedByUserId: string;
  openedByDisplayName: string;

  openedFromTerminalId: string;
  openedFromTerminalName: string;

  closingExpectedAmount: number | null;
  closingCountedAmount: number | null;
  closingDifference: number | null;

  closedAt: string | null;

  reopenCount: number;
}

export interface OpenCashSessionRequest {
  openingAmount: number;
}

export interface CloseCashSessionRequest {
  countedAmount: number;
}

export interface ReopenCashSessionRequest {
  comment?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CashSessionService {
  private readonly apiUrl = `${API_BASE_URL}/cash-sessions`;

  constructor(private readonly http: HttpClient) {}

  findCurrent(): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(`${this.apiUrl}/current`);
  }

  open(request: OpenCashSessionRequest): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.apiUrl}/open`, request);
  }

  close(cashSessionId: string, request: CloseCashSessionRequest): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.apiUrl}/${cashSessionId}/close`, request);
  }

  reopen(cashSessionId: string, request: ReopenCashSessionRequest): Observable<CashSession> {
    return this.http.post<CashSession>(`${this.apiUrl}/${cashSessionId}/reopen`, request);
  }

  findMovementSummary(cashSessionId: string): Observable<CashMovementSummary> {
    return this.http.get<CashMovementSummary>(`${this.apiUrl}/${cashSessionId}/movement-summary`);
  }

  findLatest(): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(`${this.apiUrl}/latest`);
  }
}
