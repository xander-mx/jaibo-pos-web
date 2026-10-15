import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Customer } from '@core/models/customer';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
})
export class CustomersComponent implements OnInit {
  readonly customers = signal<Customer[]>([]);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showCreate = signal(false);
  readonly newCustomerName = signal('');
  readonly newCustomerPhone = signal('');
  readonly newCustomerEmail = signal('');
  readonly newCustomerFrequent = signal(false);
  readonly newCustomerWholesale = signal(false);
  readonly newCustomerCreditEnabled = signal(false);
  readonly createLoading = signal(false);
  readonly createError = signal('');
  readonly editingCustomerId = signal<string | null>(null);

  constructor(
    private readonly customerService: CustomerService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.error.set('');

    this.customerService.findActive(this.search()).subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading customers', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar los clientes');

        this.loading.set(false);
      },
    });
  }

  clearSearch(): void {
    this.search.set('');
    this.loadCustomers();
  }

  viewAccount(customer: Customer): void {
    this.router.navigate(['/customers', customer.id, 'receivables']);
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }

  startCreate(): void {
    this.resetCreateForm();
    this.editingCustomerId.set(null);
    this.showCreate.set(true);
  }

  cancelCreate(): void {
    this.showCreate.set(false);
    this.resetCreateForm();
  }

  saveCustomer(): void {
    const name = this.newCustomerName().trim();

    if (!name) {
      this.createError.set('El nombre es obligatorio');
      return;
    }

    const phone = this.newCustomerPhone().trim();
    const email = this.newCustomerEmail().trim();

    const request = {
      name,
      phone: phone || null,
      email: email || null,
      frequent: this.newCustomerFrequent(),
      wholesale: this.newCustomerWholesale(),
      creditEnabled: this.newCustomerCreditEnabled(),
    };

    this.createLoading.set(true);
    this.createError.set('');

    const customerId = this.editingCustomerId();

    const operation = customerId
      ? this.customerService.update(customerId, request)
      : this.customerService.create(request);

    operation.subscribe({
      next: () => {
        this.createLoading.set(false);
        this.cancelCreate();
        this.loadCustomers();
      },

      error: (error) => {
        console.error(customerId ? 'Error updating customer' : 'Error creating customer', error);

        this.createError.set(
          error?.error?.detail ??
            (customerId
              ? 'No fue posible actualizar el cliente'
              : 'No fue posible crear el cliente'),
        );

        this.createLoading.set(false);
      },
    });
  }

  startEdit(customer: Customer): void {
    this.editingCustomerId.set(customer.id);
    this.newCustomerName.set(customer.name);
    this.newCustomerPhone.set(customer.phone ?? '');
    this.newCustomerEmail.set(customer.email ?? '');
    this.newCustomerFrequent.set(customer.frequent);
    this.newCustomerWholesale.set(customer.wholesale);
    this.newCustomerCreditEnabled.set(customer.creditEnabled);
    this.createError.set('');
    this.showCreate.set(true);
  }

  private resetCreateForm(): void {
    this.editingCustomerId.set(null);

    this.newCustomerName.set('');
    this.newCustomerPhone.set('');
    this.newCustomerEmail.set('');
    this.newCustomerFrequent.set(false);
    this.newCustomerWholesale.set(false);
    this.newCustomerCreditEnabled.set(false);
    this.createError.set('');
  }
}
