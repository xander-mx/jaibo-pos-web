import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import { Supplier } from '@core/models/supplier';
import { SupplierService } from './supplier.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
})
export class SuppliersComponent implements OnInit {
  readonly suppliers = signal<Supplier[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showCreateForm = signal(false);
  readonly name = signal('');
  readonly phone = signal('');
  readonly creating = signal(false);
  readonly createError = signal('');
  readonly createSuccess = signal('');
  readonly editingSupplierId = signal<string | null>(null);
  readonly supplierStatusTarget = signal<Supplier | null>(null);
  readonly statusLoading = signal(false);
  readonly statusError = signal('');

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  openCreateForm(): void {
    this.editingSupplierId.set(null);
    this.name.set('');
    this.phone.set('');
    this.createError.set('');
    this.createSuccess.set('');
    this.showCreateForm.set(true);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.editingSupplierId.set(null);
    this.name.set('');
    this.phone.set('');
    this.createError.set('');
  }

  saveSupplier(): void {
    const name = this.name().trim();
    const phone = this.phone().trim();
    const supplierId = this.editingSupplierId();

    if (!name) {
      this.createError.set('Captura el nombre del proveedor');
      return;
    }

    this.creating.set(true);
    this.createError.set('');
    this.createSuccess.set('');

    const request = {
      name,
      phone: phone || null,
    };

    const operation$ = supplierId
      ? this.supplierService.update(supplierId, request)
      : this.supplierService.create(request);

    operation$.subscribe({
      next: (supplier) => {
        this.creating.set(false);

        this.createSuccess.set(
          supplierId
            ? `Proveedor ${supplier.name} actualizado correctamente`
            : `Proveedor ${supplier.name} creado correctamente`,
        );

        this.showCreateForm.set(false);
        this.editingSupplierId.set(null);
        this.name.set('');
        this.phone.set('');

        this.loadSuppliers();
      },

      error: (error) => {
        console.error(supplierId ? 'Error updating supplier' : 'Error creating supplier', error);

        this.createError.set(
          error?.error?.detail ??
            (supplierId
              ? 'No fue posible actualizar el proveedor'
              : 'No fue posible crear el proveedor'),
        );

        this.creating.set(false);
      },
    });
  }

  openEditForm(supplier: Supplier): void {
    this.editingSupplierId.set(supplier.id);
    this.name.set(supplier.name);
    this.phone.set(supplier.phone ?? '');
    this.createError.set('');
    this.createSuccess.set('');
    this.showCreateForm.set(true);
  }

  private loadSuppliers(): void {
    this.loading.set(true);
    this.error.set('');

    this.supplierService.findAll().subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading suppliers', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar los proveedores');

        this.loading.set(false);
      },
    });
  }

  requestStatusChange(supplier: Supplier): void {
    this.supplierStatusTarget.set(supplier);
    this.statusError.set('');
  }

  cancelStatusChange(): void {
    this.supplierStatusTarget.set(null);
    this.statusError.set('');
  }

  confirmStatusChange(): void {
    const supplier = this.supplierStatusTarget();

    if (!supplier) {
      return;
    }

    this.statusLoading.set(true);
    this.statusError.set('');

    const operation$ = supplier.active
      ? this.supplierService.deactivate(supplier.id)
      : this.supplierService.activate(supplier.id);

    operation$.subscribe({
      next: () => {
        this.statusLoading.set(false);
        this.supplierStatusTarget.set(null);
        this.loadSuppliers();
      },

      error: (error) => {
        console.error(
          supplier.active ? 'Error deactivating supplier' : 'Error activating supplier',
          error,
        );

        this.statusError.set(
          error?.error?.detail ??
            (supplier.active
              ? 'No fue posible desactivar el proveedor'
              : 'No fue posible activar el proveedor'),
        );

        this.statusLoading.set(false);
      },
    });
  }

  formatPhone(phone: string | null): string {
    if (!phone) {
      return '—';
    }

    const digits = phone.replace(/\D/g, '');

    if (digits.length !== 10) {
      return phone;
    }

    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
}
