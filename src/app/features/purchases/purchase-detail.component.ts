import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { PurchaseDetail } from '@core/models/purchase-detail';
import { PurchaseService } from './purchase.service';
import { FormsModule } from '@angular/forms';

import { Product } from '@core/models/product';
import { CatalogService } from '@features/catalog/catalog.service';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.css',
})
export class PurchaseDetailComponent implements OnInit {
  readonly purchase = signal<PurchaseDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly products = signal<Product[]>([]);
  readonly productId = signal('');
  readonly quantity = signal<number | null>(null);
  readonly unitCost = signal<number | null>(null);
  readonly addingItem = signal(false);
  readonly addItemError = signal('');
  readonly removingItemId = signal<string | null>(null);
  readonly itemActionError = signal('');
  readonly receiving = signal(false);
  readonly receiveError = signal('');
  readonly showPaymentForm = signal(false);
  readonly paymentMethod = signal<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  readonly paymentSource = signal<'CASH_REGISTER' | 'EXTERNAL'>('CASH_REGISTER');
  readonly paymentAmount = signal<number | null>(null);
  readonly paymentLoading = signal(false);
  readonly paymentError = signal('');
  readonly productSearch = signal('');
  readonly showProductOptions = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly purchaseService: PurchaseService,
    private readonly catalogService: CatalogService,
  ) {}

  ngOnInit(): void {
    const purchaseId = this.route.snapshot.paramMap.get('purchaseId');

    if (!purchaseId) {
      this.error.set('Compra no válida');
      this.loading.set(false);
      return;
    }

    this.purchaseService.findById(purchaseId).subscribe({
      next: (purchase) => {
        console.log('Purchase detail:', purchase);
        this.purchase.set(purchase);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading purchase', error);
        this.error.set(error?.error?.detail ?? 'No fue posible cargar la compra');
        this.loading.set(false);
      },
    });
    this.loadProducts();
  }

  goBack(): void {
    this.router.navigate(['/purchases']);
  }

  addItem(): void {
    const purchase = this.purchase();

    if (!purchase || purchase.status !== 'DRAFT') {
      return;
    }

    const productId = this.productId();
    const quantity = this.quantity();
    const unitCost = this.unitCost();

    if (!productId) {
      this.addItemError.set('Selecciona un producto');

      return;
    }

    if (quantity === null || quantity < 0.001) {
      this.addItemError.set('Captura una cantidad válida');

      return;
    }

    if (unitCost === null || unitCost < 0) {
      this.addItemError.set('Captura un costo válido');

      return;
    }

    this.addingItem.set(true);
    this.addItemError.set('');

    this.purchaseService
      .addItem(purchase.id, {
        productId,
        quantity,
        unitCost,
      })
      .subscribe({
        next: (updatedPurchase) => {
          this.purchase.set(updatedPurchase);

          this.productId.set('');
          this.quantity.set(null);
          this.unitCost.set(null);

          this.addingItem.set(false);
        },

        error: (error) => {
          console.error('Error adding purchase item', error);

          this.addItemError.set(error?.error?.detail ?? 'No fue posible agregar la partida');

          this.addingItem.set(false);
        },
      });
  }

  removeItem(itemId: string): void {
    const purchase = this.purchase();

    if (!purchase || purchase.status !== 'DRAFT') {
      return;
    }

    this.removingItemId.set(itemId);
    this.itemActionError.set('');

    this.purchaseService.removeItem(purchase.id, itemId).subscribe({
      next: (updatedPurchase) => {
        this.purchase.set(updatedPurchase);

        this.removingItemId.set(null);
      },

      error: (error) => {
        console.error('Error removing purchase item', error);

        this.itemActionError.set(error?.error?.detail ?? 'No fue posible eliminar la partida');

        this.removingItemId.set(null);
      },
    });
  }

  receivePurchase(): void {
    const purchase = this.purchase();

    if (!purchase || purchase.status !== 'DRAFT') {
      return;
    }

    if (purchase.items.length === 0) {
      this.receiveError.set('Agrega al menos una partida antes de recibir la compra');

      return;
    }

    this.receiving.set(true);
    this.receiveError.set('');

    this.purchaseService.receive(purchase.id).subscribe({
      next: (updatedPurchase) => {
        this.purchase.set(updatedPurchase);

        this.receiving.set(false);
      },

      error: (error) => {
        console.error('Error receiving purchase', error);

        this.receiveError.set(error?.error?.detail ?? 'No fue posible recibir la compra');

        this.receiving.set(false);
      },
    });
  }

  openPaymentForm(): void {
    const purchase = this.purchase();

    if (!purchase || purchase.status !== 'RECEIVED' || purchase.pendingBalance <= 0) {
      return;
    }

    this.paymentMethod.set('CASH');
    this.paymentSource.set('CASH_REGISTER');
    this.paymentAmount.set(null);
    this.paymentError.set('');
    this.showPaymentForm.set(true);
  }

  cancelPayment(): void {
    this.showPaymentForm.set(false);
    this.paymentAmount.set(null);
    this.paymentError.set('');
  }

  changePaymentMethod(method: 'CASH' | 'TRANSFER' | 'CARD'): void {
    this.paymentMethod.set(method);

    if (method === 'CASH') {
      this.paymentSource.set('CASH_REGISTER');
    } else {
      this.paymentSource.set('EXTERNAL');
    }
  }

  registerPayment(): void {
    const purchase = this.purchase();

    const amount = this.paymentAmount();

    if (!purchase) {
      return;
    }

    if (purchase.status !== 'RECEIVED') {
      return;
    }

    if (amount === null || amount < 0.01) {
      this.paymentError.set('Captura un importe válido');

      return;
    }

    if (amount > purchase.pendingBalance) {
      this.paymentError.set('El importe no puede superar el saldo pendiente');

      return;
    }

    this.paymentLoading.set(true);
    this.paymentError.set('');

    this.purchaseService
      .registerPayment(purchase.id, {
        paymentMethod: this.paymentMethod(),

        paymentSource: this.paymentSource(),

        amount,
      })
      .subscribe({
        next: () => {
          this.paymentLoading.set(false);
          this.showPaymentForm.set(false);
          this.paymentAmount.set(null);

          this.reloadPurchase(purchase.id);
        },

        error: (error) => {
          console.error('Error registering purchase payment', error);

          this.paymentError.set(error?.error?.detail ?? 'No fue posible registrar el pago');

          this.paymentLoading.set(false);
        },
      });
  }

  canRegisterPayment(): boolean {
    const purchase = this.purchase();
    const amount = this.paymentAmount();

    if (!purchase || amount === null) {
      return false;
    }

    return amount >= 0.01 && amount <= purchase.pendingBalance && !this.paymentLoading();
  }

  filteredProducts(): Product[] {
    const search = this.normalizeText(this.productSearch());

    if (!search) {
      return this.products();
    }

    return this.products().filter((product) => this.normalizeText(product.name).includes(search));
  }

  selectPurchaseProduct(product: Product): void {
    this.productId.set(product.id);
    this.productSearch.set(product.name);
    this.showProductOptions.set(false);
    this.addItemError.set('');
  }

  clearPurchaseProduct(): void {
    this.productId.set('');
    this.productSearch.set('');
    this.showProductOptions.set(false);
  }

  private reloadPurchase(purchaseId: string): void {
    this.purchaseService.findById(purchaseId).subscribe({
      next: (purchase) => {
        this.purchase.set(purchase);
      },

      error: (error) => {
        console.error('Error reloading purchase', error);
      },
    });
  }

  private loadProducts(): void {
    this.catalogService.findSellableProducts().subscribe({
      next: (products) => {
        this.products.set(products.filter((product) => product.purchasable));
      },

      error: (error) => {
        console.error('Error loading purchasable products', error);
      },
    });
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
