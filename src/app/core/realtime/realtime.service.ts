import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from '@core/config/api.config';
import { environment } from '../../../environments/environment';

export interface SaleRealtimeEvent {
  saleId: string;
  branchId: string;
  type: string;
  occurredAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private client?: Client;

  private readonly saleEventsSubject = new Subject<SaleRealtimeEvent>();

  readonly saleEvents$: Observable<SaleRealtimeEvent> = this.saleEventsSubject.asObservable();

  connect(token: string, terminalId: string, branchId: string): void {
    this.client = new Client({
      brokerURL: `${WS_BASE_URL}/ws`,

      connectHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Terminal-Id': terminalId,
      },

      reconnectDelay: 5000,

      debug: environment.production
        ? () => {}
        : (message) => {
            console.log('[STOMP]', message);
          },
    });

    this.client.onConnect = () => {
      if (!environment.production) {
        console.log('WebSocket connected');
      }

      this.client?.subscribe(`/topic/branches/${branchId}/sales`, (message: IMessage) => {
        const event = JSON.parse(message.body) as SaleRealtimeEvent;

        if (!environment.production) {
          console.log('WebSocket connected');
        }

        this.saleEventsSubject.next(event);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
    };

    this.client.activate();
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    this.client.deactivate();
    this.client = undefined;
  }
}
