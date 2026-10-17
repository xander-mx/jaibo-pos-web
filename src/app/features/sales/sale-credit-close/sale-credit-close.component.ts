import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CloseCreditSaleRequest, SalePaymentRequest, SalesService } from '../sales.service';
import { PaymentMethod, paymentMethodLabel } from '@core/models/payment-method';

import { SaleDetail } from '@core/models/sale-detail';

@Component({
  selector: 'app-sale-credit-close',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-credit-close.component.html',
  styleUrl: './sale-credit-close.component.css',
})
export class SaleCreditCloseComponent {
  readonly saleId = input.required<string>();
  readonly total = input.required<number>();

  readonly closed = output<SaleDetail>();
  readonly cancelled = output<void>();

  readonly payments = signal<SalePaymentRequest[]>([]);
  readonly PaymentMethod = PaymentMethod;
  readonly paymentMethod = signal<PaymentMethod>(PaymentMethod.CASH);
  readonly paymentMethodLabel = paymentMethodLabel;

  readonly amount = signal<number | null>(null);

  readonly cashReceived = signal<number | null>(null);

  readonly error = signal('');
  readonly loading = signal(false);

  constructor(private readonly salesService: SalesService) {}

  paidAmount(): number {
    return this.payments().reduce((sum, payment) => sum + payment.amount, 0);
  }

  remaining(): number {
    return Math.max(0, this.total() - this.paidAmount());
  }

  change(): number {
    if (this.paymentMethod() !== PaymentMethod.CASH) {
      return 0;
    }

    const amount = this.amount();
    const received = this.cashReceived();

    if (amount === null || received === null) {
      return 0;
    }

    return Math.max(0, received - amount);
  }

  addPayment(): void {
    const method = this.paymentMethod();

    const amount = this.amount();

    if (amount === null || amount <= 0) {
      this.error.set('Captura un importe válido');
      return;
    }

    if (amount > this.remaining()) {
      this.error.set('El importe supera el saldo pendiente');
      return;
    }

    if (method === PaymentMethod.CASH) {
      const received = this.cashReceived();

      if (received === null || received < amount) {
        this.error.set('El efectivo recibido no cubre el importe a aplicar');
        return;
      }
    }

    this.payments.update((payments) => [
      ...payments,
      {
        paymentMethod: method,
        amount,
      },
    ]);

    this.amount.set(null);
    this.cashReceived.set(null);
    this.error.set('');
  }

  removePayment(index: number): void {
    this.payments.update((payments) =>
      payments.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  confirm(): void {
    const request: CloseCreditSaleRequest = {
      payments: this.payments(),
    };

    this.loading.set(true);
    this.error.set('');

    this.salesService.closeAsCredit(this.saleId(), request).subscribe({
      next: (sale) => {
        this.loading.set(false);
        this.closed.emit(sale);
      },

      error: (error) => {
        console.error('Error closing credit sale', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cerrar la cuenta a crédito');

        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
