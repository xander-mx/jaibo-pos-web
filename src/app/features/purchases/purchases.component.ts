import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Purchase } from '@core/models/purchase';
import { PurchaseService } from './purchase.service';
import { Supplier } from '@core/models/supplier';
import { SupplierService } from '@features/suppliers/supplier.service';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchases.component.html',
  styleUrl: './purchases.component.css',
})
export class PurchasesComponent implements OnInit {
  readonly purchases = signal<Purchase[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly suppliers = signal<Supplier[]>([]);
  readonly showCreateForm = signal(false);
  readonly supplierId = signal<string>('');
  readonly note = signal('');
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly filterStatus = signal<string>('');
  readonly filterPaymentStatus = signal<string>('');
  readonly filterSupplierId = signal<string>('');
  readonly filterPendingOnly = signal(false);

  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly supplierService: SupplierService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadPurchases();
    this.loadSuppliers();
  }

  openCreateForm(): void {
    this.supplierId.set('');
    this.note.set('');
    this.createError.set('');
    this.showCreateForm.set(true);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.supplierId.set('');
    this.note.set('');
    this.createError.set('');
  }

  createPurchase(): void {
    const supplierId = this.supplierId();

    const note = this.note().trim();

    this.creating.set(true);
    this.createError.set('');

    this.purchaseService
      .create({
        supplierId: supplierId || null,

        note: note || null,
      })
      .subscribe({
        next: (purchase) => {
          this.creating.set(false);

          this.router.navigate(['/purchases', purchase.id]);
        },

        error: (error) => {
          console.error('Error creating purchase', error);
          this.createError.set(error?.error?.detail ?? 'No fue posible crear la compra');
          this.creating.set(false);
        },
      });
  }

  loadPurchases(): void {
    this.loading.set(true);
    this.error.set('');

    this.purchaseService
      .findAll({
        status: this.filterStatus()
          ? (this.filterStatus() as 'DRAFT' | 'RECEIVED' | 'CANCELLED')
          : null,

        paymentStatus: this.filterPaymentStatus()
          ? (this.filterPaymentStatus() as 'PENDING' | 'PARTIALLY_PAID' | 'PAID')
          : null,

        supplierId: this.filterSupplierId() || null,

        pendingOnly: this.filterPendingOnly(),
      })
      .subscribe({
        next: (purchases) => {
          this.purchases.set(purchases);

          this.loading.set(false);
        },

        error: (error) => {
          console.error('Error loading purchases', error);

          this.error.set('No fue posible cargar las compras');

          this.loading.set(false);
        },
      });
  }

  openPurchase(purchaseId: string): void {
    this.router.navigate(['/purchases', purchaseId]);
  }

  clearFilters(): void {
    this.filterStatus.set('');
    this.filterPaymentStatus.set('');
    this.filterSupplierId.set('');
    this.filterPendingOnly.set(false);

    this.loadPurchases();
  }

  private loadSuppliers(): void {
    this.supplierService.findAll().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers.filter((supplier) => supplier.active));
      },

      error: (error) => {
        console.error('Error loading suppliers', error);
      },
    });
  }
}
