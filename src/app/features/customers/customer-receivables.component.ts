import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Customer } from '@core/models/customer';
import { Receivable } from '@core/models/receivable';
import { CustomerService } from './customer.service';
import { FormsModule } from '@angular/forms';
import { CreditPayment } from '@core/models/credit-payment';

@Component({
  selector: 'app-customer-receivables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-receivables.component.html',
  styleUrl: './customer-receivables.component.css',
})
export class CustomerReceivablesComponent implements OnInit {
  readonly customer = signal<Customer | null>(null);
  readonly receivables = signal<Receivable[]>([]);
  readonly paidReceivables = signal<Receivable[]>([]);
  readonly paidReceivablesLoading = signal(false);
  readonly paidReceivablesError = signal('');
  readonly creditPayments = signal<CreditPayment[]>([]);
  readonly paymentsLoading = signal(false);
  readonly paymentsError = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showPayment = signal(false);
  readonly paymentMethod = signal<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  readonly paymentAmount = signal<number | null>(null);
  readonly paymentLoading = signal(false);
  readonly paymentError = signal('');
  readonly cashReceived = signal<number | null>(null);
  readonly selectedReceivable = signal<Receivable | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly customerService: CustomerService,
  ) {}

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('customerId');

    if (!customerId) {
      this.error.set('Cliente no válido');

      this.loading.set(false);
      return;
    }

    this.loadCustomer(customerId);
    this.loadReceivables(customerId);
    this.loadCreditPayments(customerId);
    this.loadPaidReceivables(customerId);
  }

  totalBalance(): number {
    return this.receivables().reduce((sum, receivable) => sum + receivable.balance, 0);
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }

  startPayment(): void {
    if (this.totalBalance() <= 0) {
      return;
    }

    this.selectedReceivable.set(null);
    this.paymentMethod.set('CASH');
    this.paymentAmount.set(null);
    this.cashReceived.set(null);
    this.paymentError.set('');
    this.showPayment.set(true);
  }

  cancelPayment(): void {
    this.showPayment.set(false);
    this.selectedReceivable.set(null);
    this.paymentAmount.set(null);
    this.cashReceived.set(null);
    this.paymentError.set('');
  }

  applyPayment(): void {
    const customerId = this.route.snapshot.paramMap.get('customerId');

    const amount = this.paymentAmount();
    const receivable = this.selectedReceivable();

    if (!customerId) {
      return;
    }

    if (amount === null || amount <= 0) {
      this.paymentError.set('Captura un importe válido');
      return;
    }

    const maximumAmount = receivable?.balance ?? this.totalBalance();

    if (amount > maximumAmount) {
      this.paymentError.set(
        receivable
          ? 'El abono no puede superar el saldo de la cuenta'
          : 'El abono no puede superar el saldo total',
      );
      return;
    }

    if (this.paymentMethod() === 'CASH') {
      const received = this.cashReceived();

      if (received === null || received < amount) {
        this.paymentError.set('El efectivo recibido no cubre el importe del abono');
        return;
      }
    }

    this.paymentLoading.set(true);
    this.paymentError.set('');

    const request = receivable
      ? this.customerService.applyCreditPayment(customerId, {
          receivableId: receivable.id,
          paymentMethod: this.paymentMethod(),
          amount,
        })
      : this.customerService.applyAutomaticCreditPayment(customerId, {
          paymentMethod: this.paymentMethod(),
          amount,
        });

    request.subscribe({
      next: () => {
        this.paymentLoading.set(false);
        this.cancelPayment();

        this.loadReceivables(customerId);
        this.loadCreditPayments(customerId);
      },

      error: (error) => {
        console.error('Error applying payment', error);

        this.paymentError.set(error?.error?.detail ?? 'No fue posible registrar el abono');

        this.paymentLoading.set(false);
      },
    });
  }

  change(): number {
    if (this.paymentMethod() !== 'CASH') {
      return 0;
    }

    const amount = this.paymentAmount();
    const received = this.cashReceived();

    if (amount === null || received === null) {
      return 0;
    }

    return Math.max(0, received - amount);
  }

  startReceivablePayment(receivable: Receivable): void {
    this.selectedReceivable.set(receivable);
    this.paymentMethod.set('CASH');
    this.paymentAmount.set(null);
    this.cashReceived.set(null);
    this.paymentError.set('');
    this.showPayment.set(true);
  }

  private loadCustomer(customerId: string): void {
    this.customerService.findActive().subscribe({
      next: (customers) => {
        const customer = customers.find((value) => value.id === customerId);

        if (customer) {
          this.customer.set(customer);
        }
      },

      error: (error) => {
        console.error('Error loading customer', error);
      },
    });
  }

  private loadReceivables(customerId: string): void {
    this.customerService.findOpenReceivables(customerId).subscribe({
      next: (receivables) => {
        this.receivables.set(receivables);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading receivables', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar las cuentas por cobrar');

        this.loading.set(false);
      },
    });
  }

  private loadCreditPayments(customerId: string): void {
    this.paymentsLoading.set(true);
    this.paymentsError.set('');

    this.customerService.findCreditPayments(customerId).subscribe({
      next: (payments) => {
        this.creditPayments.set(payments);

        this.paymentsLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading credit payments', error);

        this.paymentsError.set(
          error?.error?.detail ?? 'No fue posible cargar el historial de abonos',
        );

        this.paymentsLoading.set(false);
      },
    });
  }

  private loadPaidReceivables(customerId: string): void {
    this.paidReceivablesLoading.set(true);
    this.paidReceivablesError.set('');

    this.customerService.findPaidReceivables(customerId).subscribe({
      next: (receivables) => {
        this.paidReceivables.set(receivables);

        this.paidReceivablesLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading paid receivables', error);

        this.paidReceivablesError.set(
          error?.error?.detail ?? 'No fue posible cargar las cuentas liquidadas',
        );

        this.paidReceivablesLoading.set(false);
      },
    });
  }
}
