import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeService } from '@core/realtime/realtime.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SalesService } from './sales.service';
import { Sale } from '@core/models/sale';
import { CashSessionService } from '../cash/cash-session.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
})
export class SalesComponent implements OnInit {
  readonly sales = signal<Sale[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly openingSale = signal(false);
  readonly openSaleError = signal('');
  readonly showNewSale = signal(false);
  readonly newSaleReference = signal('');
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly salesService: SalesService,
    private readonly realtimeService: RealtimeService,
    private readonly cashSessionService: CashSessionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSales();
    this.realtimeService.saleEvents$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      console.log('Refreshing open sales from realtime event');
      this.loadSales();
    });
  }

  newSale(): void {
    if (this.openingSale()) {
      return;
    }

    this.openingSale.set(true);
    this.openSaleError.set('');

    this.cashSessionService.findCurrent().subscribe({
      next: (cashSession) => {
        if (!cashSession) {
          this.openSaleError.set('No hay una caja abierta');

          this.openingSale.set(false);
          return;
        }

        const reference = this.newSaleReference().trim();

        this.salesService
          .openSale({
            cashSessionId: cashSession.id,
            reference: reference || null,
          })
          .subscribe({
            next: (sale) => {
              this.openingSale.set(false);
              this.showNewSale.set(false);
              this.newSaleReference.set('');

              this.router.navigate(['/sales', sale.id]);
            },

            error: (error) => {
              console.error('Error opening sale', error);

              this.openSaleError.set(error?.error?.detail ?? 'No fue posible crear la cuenta');

              this.openingSale.set(false);
            },
          });
      },

      error: (error) => {
        console.error('Error loading current cash session', error);

        this.openSaleError.set(error?.error?.detail ?? 'No fue posible consultar la caja actual');

        this.openingSale.set(false);
      },
    });
  }

  startNewSale(): void {
    this.newSaleReference.set('');
    this.openSaleError.set('');
    this.showNewSale.set(true);
  }

  cancelNewSale(): void {
    if (this.openingSale()) {
      return;
    }

    this.showNewSale.set(false);
    this.newSaleReference.set('');
    this.openSaleError.set('');
  }

  private loadSales(): void {
    this.loading.set(true);
    this.error.set('');
    console.log('Cargando cuentas abiertas...');

    this.salesService.findOpen().subscribe({
      next: (sales) => {
        console.log('Ventas recibidas:', sales);
        this.sales.set(sales);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sales', error);
        this.error.set('No fue posible cargar las cuentas');
        this.loading.set(false);
      },
    });
  }
}
