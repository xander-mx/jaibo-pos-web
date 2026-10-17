import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CashMovementSummary, CashSession, CashSessionService } from './cash-session.service';

@Component({
  selector: 'app-cash-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-session.component.html',
  styleUrl: './cash-session.component.css',
})
export class CashSessionComponent implements OnInit {
  readonly cashSession = signal<CashSession | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly openingAmount = signal<number | null>(null);
  readonly opening = signal(false);
  readonly openError = signal('');
  readonly closingAmount = signal<number | null>(null);
  readonly closing = signal(false);
  readonly closeError = signal('');
  readonly reopenComment = signal('');
  readonly reopening = signal(false);
  readonly reopenError = signal('');
  readonly movementSummary = signal<CashMovementSummary | null>(null);
  readonly movementSummaryLoading = signal(false);
  readonly movementSummaryError = signal('');
  readonly showCloseConfirmation = signal(false);

  constructor(private readonly cashSessionService: CashSessionService) {}

  ngOnInit(): void {
    this.loadCurrentCashSession();
  }

  openCashSession(): void {
    const openingAmount = this.openingAmount();

    if (openingAmount === null || openingAmount < 0) {
      this.openError.set('Captura un monto inicial válido');

      return;
    }

    this.opening.set(true);
    this.openError.set('');

    this.cashSessionService
      .open({
        openingAmount,
      })
      .subscribe({
        next: (cashSession) => {
          this.cashSession.set(cashSession);
          this.loadMovementSummary(cashSession.id);
          this.openingAmount.set(null);
          this.opening.set(false);
        },

        error: (error) => {
          console.error('Error opening cash session', error);

          this.openError.set(error?.error?.detail ?? 'No fue posible abrir la caja');

          this.opening.set(false);
        },
      });
  }

  reopenCashSession(): void {
    const cashSession = this.cashSession();

    if (!cashSession) {
      return;
    }

    const comment = this.reopenComment().trim();

    if (!comment) {
      this.reopenError.set('Captura el motivo de reapertura');
      return;
    }

    this.reopening.set(true);
    this.reopenError.set('');

    this.cashSessionService
      .reopen(cashSession.id, {
        comment: comment,
      })
      .subscribe({
        next: (reopenedSession) => {
          this.cashSession.set(reopenedSession);
          this.reopenComment.set('');
          this.reopening.set(false);
        },

        error: (error) => {
          console.error('Error reopening cash session', error);

          this.reopenError.set(error?.error?.detail ?? 'No fue posible reabrir la caja');

          this.reopening.set(false);
        },
      });
  }

  movementTotal(type: string, direction: 'IN' | 'OUT'): number {
    const summary = this.movementSummary();

    if (!summary) {
      return 0;
    }

    return summary.movements
      .filter((movement) => movement.type === type && movement.direction === direction)
      .reduce((total, movement) => total + movement.total, 0);
  }

  otherIncomeTotal(): number {
    const summary = this.movementSummary();

    if (!summary) {
      return 0;
    }

    return summary.movements
      .filter(
        (movement) =>
          movement.direction === 'IN' &&
          movement.type !== 'SALE_PAYMENT' &&
          movement.type !== 'CUSTOMER_PAYMENT',
      )
      .reduce((total, movement) => total + movement.total, 0);
  }

  movementNetTotal(): number {
    const summary = this.movementSummary();

    if (!summary) {
      return 0;
    }

    return summary.incomeTotal - summary.outcomeTotal;
  }

  private loadCurrentCashSession(): void {
    this.loading.set(true);
    this.error.set('');

    this.cashSessionService.findLatest().subscribe({
      next: (cashSession) => {
        this.cashSession.set(cashSession);

        if (cashSession) {
          this.loadMovementSummary(cashSession.id);
        }

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading current cash session', error);

        this.error.set('No fue posible consultar la caja actual');

        this.loading.set(false);
      },
    });
  }

  closeCashSession(): void {
    const cashSession = this.cashSession();
    const countedAmount = this.closingAmount();

    if (!cashSession) {
      return;
    }

    if (countedAmount === null || countedAmount < 0) {
      this.closeError.set('Captura el efectivo contado');

      return;
    }

    this.closing.set(true);
    this.closeError.set('');

    this.cashSessionService
      .close(cashSession.id, {
        countedAmount,
      })
      .subscribe({
        next: (closedSession) => {
          this.cashSession.set(closedSession);
          this.closingAmount.set(null);
          this.showCloseConfirmation.set(false);
          this.closing.set(false);
        },

        error: (error) => {
          console.error('Error closing cash session', error);

          this.closeError.set(error?.error?.detail ?? 'No fue posible cerrar la caja');

          this.closing.set(false);
        },
      });
  }

  canCloseCashSession(): boolean {
    const value = this.closingAmount();
    return (
      value !== null &&
      !Number.isNaN(Number(value)) &&
      Number(value) >= 0 &&
      this.movementSummary() !== null &&
      !this.closing()
    );
  }

  confirmCloseCashSession(): void {
    if (!this.canCloseCashSession()) {
      return;
    }

    this.showCloseConfirmation.set(true);
  }

  cancelCloseConfirmation(): void {
    this.showCloseConfirmation.set(false);
  }

  get countedAmountNumber(): number {
    return Number(this.closingAmount() ?? 0);
  }

  get closingDifference(): number {
    return this.countedAmountNumber - (this.movementSummary()?.expectedAmount ?? 0);
  }

  private loadMovementSummary(cashSessionId: string): void {
    this.movementSummaryLoading.set(true);
    this.movementSummaryError.set('');

    this.cashSessionService.findMovementSummary(cashSessionId).subscribe({
      next: (summary) => {
        this.movementSummary.set(summary);
        this.movementSummaryLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading cash movement summary', error);

        this.movementSummaryError.set(
          error?.error?.detail ?? 'No fue posible cargar el resumen de movimientos',
        );

        this.movementSummaryLoading.set(false);
      },
    });
  }
}
