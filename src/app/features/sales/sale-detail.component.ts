import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { SalesService } from './sales.service';
import { SaleDetail } from '@core/models/sale-detail';
import { Category } from '@core/models/category';
import { Product } from '@core/models/product';
import { ProductPresentation } from '@core/models/product-presentation';
import { CatalogService } from '@features/catalog/catalog.service';
import { SaleItem } from '@core/models/sale-item';
import { SalePaymentComponent } from './sale-payment/sale-payment.component';
import { Customer } from '@core/models/customer';
import { CustomerService } from '@features/customers/customer.service';
import { SaleCreditCloseComponent } from './sale-credit-close/sale-credit-close.component';
import { Sale } from '@core/models/sale';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeService } from '@core/realtime/realtime.service';
import { CashSessionService } from '@features/cash/cash-session.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SalePaymentComponent, SaleCreditCloseComponent],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.css',
})
export class SaleDetailComponent implements OnInit {
  readonly sale = signal<SaleDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly presentations = signal<ProductPresentation[]>([]);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly selectedProduct = signal<Product | null>(null);
  readonly addingItem = signal(false);
  readonly pendingPresentation = signal<ProductPresentation | null>(null);
  readonly pendingQuantity = signal<number | null>(null);
  readonly pendingPrice = signal<number | null>(null);
  readonly itemInputError = signal('');
  readonly editingItemId = signal<string | null>(null);
  readonly editingQuantity = signal<number | null>(null);
  readonly editingPrice = signal<number | null>(null);
  readonly itemActionError = signal('');
  readonly discountItemId = signal<string | null>(null);
  readonly discountType = signal<'AMOUNT' | 'PERCENT'>('PERCENT');
  readonly discountValue = signal<number | null>(null);
  readonly discountError = signal('');
  readonly itemCommercialActionLoading = signal(false);
  readonly showSaleDiscount = signal(false);
  readonly saleDiscountType = signal<'AMOUNT' | 'PERCENT'>('PERCENT');
  readonly saleDiscountValue = signal<number | null>(null);
  readonly saleDiscountError = signal('');
  readonly saleDiscountLoading = signal(false);
  readonly showPayment = signal(false);
  readonly creditError = signal('');
  readonly customers = signal<Customer[]>([]);
  readonly showCustomerSelector = signal(false);
  readonly selectedCustomerId = signal<string | null>(null);
  readonly customerLoading = signal(false);
  readonly customerError = signal('');
  readonly showCreditClose = signal(false);
  readonly otherOpenSales = signal<Sale[]>([]);
  readonly movingItemId = signal<string | null>(null);
  readonly selectedTargetSaleId = signal<string | null>(null);
  readonly moveError = signal('');
  readonly splitQuantity = signal<number | null>(null);
  readonly cancellingSale = signal(false);
  readonly cancelSaleError = signal('');
  readonly showCancelSale = signal(false);
  readonly cancelReason = signal('');
  readonly mobilePanel = signal<'accounts' | 'catalog' | 'order'>('catalog');
  readonly currentSaleId = signal<string | null>(null);
  readonly showNewSale = signal(false);
  readonly newSaleReference = signal('');
  readonly newSaleCustomerId = signal<string | null>(null);
  readonly creatingSale = signal(false);
  readonly newSaleError = signal('');
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly salesService: SalesService,
    private readonly catalogService: CatalogService,
    private readonly customerService: CustomerService,
    private readonly realtimeService: RealtimeService,
    private readonly cashService: CashSessionService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const saleId = params.get('saleId');

      if (!saleId) {
        this.error.set('Venta no válida');

        this.loading.set(false);
        return;
      }

      this.currentSaleId.set(saleId);

      this.loading.set(true);
      this.error.set('');

      /*
       * Limpiamos únicamente
       * estado visual de la cuenta
       * anterior.
       */
      this.selectedProduct.set(null);
      this.presentations.set([]);

      this.pendingPresentation.set(null);

      this.editingItemId.set(null);
      this.movingItemId.set(null);

      this.showPayment.set(false);
      this.showCreditClose.set(false);
      this.showCancelSale.set(false);

      this.loadSale(saleId);
      this.loadOtherOpenSales();
    });

    this.realtimeService.saleEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const saleId = this.currentSaleId();

        if (!saleId || event.saleId !== saleId) {
          return;
        }

        this.loadSale(saleId, false);
      });

    this.loadCatalog();
    this.loadCustomers();
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  visibleProducts(): Product[] {
    const categoryId = this.selectedCategoryId();

    if (!categoryId) {
      return this.products();
    }

    return this.products().filter((product) => product.category.id === categoryId);
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(null);
    this.presentations.set([]);
    this.pendingPresentation.set(null);
    this.itemInputError.set('');

    this.catalogService.findPresentations(product.id).subscribe({
      next: (presentations) => {
        /*
         * Una presentación:
         * no mostramos sección intermedia.
         */
        if (presentations.length === 1) {
          this.addPresentation(presentations[0]);

          return;
        }

        /*
         * Varias presentaciones:
         * ahora sí mostramos producto
         * y sus opciones.
         */
        if (presentations.length > 1) {
          this.selectedProduct.set(product);

          this.presentations.set(presentations);
        }
      },

      error: (error) => {
        console.error('Error loading presentations', error);
      },
    });
  }

  showMobilePanel(panel: 'accounts' | 'catalog' | 'order'): void {
    this.mobilePanel.set(panel);
  }

  openSale(saleId: string): void {
    if (this.currentSaleId() === saleId) {
      this.mobilePanel.set('order');
      return;
    }

    this.mobilePanel.set('catalog');
    this.router.navigate(['/sales', saleId]);
  }

  startNewSale(): void {
    this.newSaleReference.set('');
    this.newSaleCustomerId.set(null);
    this.newSaleError.set('');
    this.showNewSale.set(true);
  }

  cancelNewSale(): void {
    this.showNewSale.set(false);
    this.newSaleReference.set('');
    this.newSaleCustomerId.set(null);
    this.newSaleError.set('');
  }

  private loadCatalog(): void {
    this.catalogService.findCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },

      error: (error) => {
        console.error('Error loading categories', error);
      },
    });

    this.catalogService.findSellableProducts().subscribe({
      next: (products) => {
        this.products.set(products);
      },

      error: (error) => {
        console.error('Error loading products', error);
      },
    });
  }

  addPresentation(presentation: ProductPresentation): void {
    /*
     * Si necesita cantidad o precio capturado,
     * mostramos el formulario.
     */
    if (presentation.variableQuantity || presentation.openPrice) {
      this.pendingPresentation.set(presentation);

      this.itemInputError.set('');

      this.pendingQuantity.set(
        presentation.variableQuantity ? (presentation.minimumQuantity ?? null) : 1,
      );

      /*
       * Precio abierto:
       * no sugerimos precio automáticamente.
       */
      this.pendingPrice.set(presentation.openPrice ? null : presentation.salePrice);

      return;
    }

    /*
     * Precio fijo + cantidad fija:
     * agregar inmediatamente.
     */
    this.sendItem(presentation, 1);
  }

  confirmPresentation(): void {
    const presentation = this.pendingPresentation();

    if (!presentation) {
      return;
    }

    const quantity = presentation.variableQuantity ? this.pendingQuantity() : 1;

    if (quantity === null || quantity <= 0) {
      this.itemInputError.set('Captura una cantidad válida');

      return;
    }

    if (
      presentation.variableQuantity &&
      presentation.minimumQuantity !== null &&
      quantity < presentation.minimumQuantity
    ) {
      this.itemInputError.set(`La cantidad mínima es ${presentation.minimumQuantity}`);

      return;
    }

    if (
      presentation.variableQuantity &&
      this.countDecimals(quantity) > presentation.unit.decimalPlaces
    ) {
      this.itemInputError.set(`Solo se permiten ${presentation.unit.decimalPlaces} decimales`);

      return;
    }

    let unitPrice: number | undefined;

    if (presentation.openPrice) {
      const price = this.pendingPrice();

      if (price === null || price < 0) {
        this.itemInputError.set('Captura un precio válido');

        return;
      }

      unitPrice = price;
    }

    this.itemInputError.set('');

    this.sendItem(presentation, quantity, unitPrice);
  }

  cancelPendingPresentation(): void {
    this.pendingPresentation.set(null);
    this.pendingQuantity.set(null);
    this.pendingPrice.set(null);
    this.itemInputError.set('');
  }

  startDiscount(item: SaleItem): void {
    this.discountItemId.set(item.id);
    this.discountType.set(item.discountType === 'AMOUNT' ? 'AMOUNT' : 'PERCENT');
    this.discountValue.set(item.discountType !== 'NONE' ? item.discountValue : null);
    this.discountError.set('');
  }

  cancelDiscount(): void {
    this.discountItemId.set(null);
    this.discountValue.set(null);
    this.discountError.set('');
  }

  applyDiscount(item: SaleItem): void {
    const currentSale = this.sale();
    const value = this.discountValue();
    const type = this.discountType();

    if (!currentSale) {
      return;
    }

    if (value === null || value < 0) {
      this.discountError.set('Captura un descuento válido');
      return;
    }

    if (type === 'PERCENT' && value > 100) {
      this.discountError.set('El porcentaje no puede ser mayor a 100');
      return;
    }

    this.itemCommercialActionLoading.set(true);
    this.discountError.set('');

    this.salesService.applyItemDiscount(currentSale.id, item.id, type, value).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.itemCommercialActionLoading.set(false);
        this.cancelDiscount();
      },

      error: (error) => {
        console.error(error);
        this.discountError.set(error?.error?.detail ?? 'No fue posible aplicar el descuento');
        this.itemCommercialActionLoading.set(false);
      },
    });
  }

  removeDiscount(item: SaleItem): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.itemCommercialActionLoading.set(true);

    this.salesService.removeItemDiscount(currentSale.id, item.id).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.itemCommercialActionLoading.set(false);
        this.cancelDiscount();
      },

      error: (error) => {
        console.error(error);
        this.itemActionError.set(error?.error?.detail ?? 'No fue posible quitar el descuento');
        this.itemCommercialActionLoading.set(false);
      },
    });
  }

  toggleCourtesy(item: SaleItem): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.itemCommercialActionLoading.set(true);

    const request = item.courtesy
      ? this.salesService.removeItemCourtesy(currentSale.id, item.id)
      : this.salesService.markItemCourtesy(currentSale.id, item.id);

    request.subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.itemCommercialActionLoading.set(false);
        this.cancelDiscount();
      },

      error: (error) => {
        console.error(error);
        this.itemActionError.set(error?.error?.detail ?? 'No fue posible cambiar la cortesía');
        this.itemCommercialActionLoading.set(false);
      },
    });
  }

  startSaleDiscount(): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.saleDiscountType.set(currentSale.saleDiscountType === 'AMOUNT' ? 'AMOUNT' : 'PERCENT');

    this.saleDiscountValue.set(
      currentSale.saleDiscountType !== 'NONE' ? currentSale.saleDiscountValue : null,
    );

    this.saleDiscountError.set('');
    this.showSaleDiscount.set(true);
  }

  cancelSaleDiscount(): void {
    this.showSaleDiscount.set(false);
    this.saleDiscountValue.set(null);
    this.saleDiscountError.set('');
  }

  applySaleDiscount(): void {
    const currentSale = this.sale();
    const value = this.saleDiscountValue();
    const type = this.saleDiscountType();

    if (!currentSale) {
      return;
    }

    if (value === null || value < 0) {
      this.saleDiscountError.set('Captura un descuento válido');
      return;
    }

    if (type === 'PERCENT' && value > 100) {
      this.saleDiscountError.set('El porcentaje no puede ser mayor a 100');
      return;
    }

    this.saleDiscountLoading.set(true);

    this.salesService.applySaleDiscount(currentSale.id, type, value).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);

        this.saleDiscountLoading.set(false);
        this.cancelSaleDiscount();
      },

      error: (error) => {
        console.error(error);

        this.saleDiscountError.set(error?.error?.detail ?? 'No fue posible aplicar el descuento');

        this.saleDiscountLoading.set(false);
      },
    });
  }

  removeSaleDiscount(): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.saleDiscountLoading.set(true);

    this.salesService.removeSaleDiscount(currentSale.id).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);

        this.saleDiscountLoading.set(false);
        this.cancelSaleDiscount();
      },

      error: (error) => {
        console.error(error);

        this.saleDiscountError.set(error?.error?.detail ?? 'No fue posible quitar el descuento');

        this.saleDiscountLoading.set(false);
      },
    });
  }

  private countDecimals(value: number): number {
    const text = value.toString();

    const decimalIndex = text.indexOf('.');

    if (decimalIndex < 0) {
      return 0;
    }

    return text.length - decimalIndex - 1;
  }

  private sendItem(presentation: ProductPresentation, quantity: number, unitPrice?: number): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    /*
     * Buscamos una partida compatible
     * para aumentar cantidad en lugar
     * de crear otra línea.
     */
    const existingItem = currentSale.items.find((item) => {
      if (item.presentationId !== presentation.id) {
        return false;
      }

      /*
       * No mezclar partidas con
       * descuento.
       */
      if (item.discountType !== 'NONE') {
        return false;
      }

      /*
       * No mezclar cortesías.
       */
      if (item.courtesy) {
        return false;
      }

      /*
       * En precio abierto solo mezclamos
       * si el precio es exactamente igual.
       */
      if (unitPrice !== undefined && item.unitPrice !== unitPrice) {
        return false;
      }

      return true;
    });

    this.addingItem.set(true);

    /*
     * Ya existe:
     * aumentamos cantidad.
     */
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      this.salesService.changeItemQuantity(currentSale.id, existingItem.id, newQuantity).subscribe({
        next: (updatedSale) => {
          this.sale.set(updatedSale);

          this.addingItem.set(false);

          this.cancelPendingPresentation();

          this.selectedProduct.set(null);
          this.presentations.set([]);
        },

        error: (error) => {
          console.error('Error increasing item quantity', error);

          this.addingItem.set(false);

          this.itemInputError.set(error?.error?.detail ?? 'No fue posible aumentar la cantidad');
        },
      });

      return;
    }

    /*
     * No existe una partida compatible:
     * creamos una nueva.
     */
    const request = {
      presentationId: presentation.id,

      quantity,

      ...(unitPrice !== undefined ? { unitPrice } : {}),
    };

    this.salesService.addItem(currentSale.id, request).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);

        this.addingItem.set(false);

        this.cancelPendingPresentation();

        this.selectedProduct.set(null);
        this.presentations.set([]);
      },

      error: (error) => {
        console.error('Error adding item', error);

        this.addingItem.set(false);

        this.itemInputError.set(error?.error?.detail ?? 'No fue posible agregar la partida');
      },
    });
  }

  quantityStep(decimalPlaces: number): number {
    if (decimalPlaces <= 0) {
      return 1;
    }

    return Math.pow(10, -decimalPlaces);
  }

  startEditItem(item: SaleItem): void {
    this.editingItemId.set(item.id);
    this.editingQuantity.set(item.quantity);
    this.editingPrice.set(item.unitPrice);
    this.itemActionError.set('');
  }

  cancelEditItem(): void {
    this.editingItemId.set(null);
    this.editingQuantity.set(null);
    this.editingPrice.set(null);
    this.itemActionError.set('');
  }

  saveItemQuantity(item: SaleItem): void {
    const currentSale = this.sale();
    const quantity = this.editingQuantity();

    if (!currentSale || quantity === null || quantity <= 0) {
      this.itemActionError.set('Captura una cantidad válida');
      return;
    }

    this.salesService.changeItemQuantity(currentSale.id, item.id, quantity).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.cancelEditItem();
      },

      error: (error) => {
        console.error(error);

        this.itemActionError.set(error?.error?.detail ?? 'No fue posible cambiar la cantidad');
      },
    });
  }

  saveItemPrice(item: SaleItem): void {
    const currentSale = this.sale();
    const price = this.editingPrice();

    if (!currentSale || price === null || price < 0) {
      this.itemActionError.set('Captura un precio válido');
      return;
    }

    this.salesService.changeItemPrice(currentSale.id, item.id, price).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.cancelEditItem();
      },

      error: (error) => {
        console.error(error);

        this.itemActionError.set(error?.error?.detail ?? 'No fue posible cambiar el precio');
      },
    });
  }

  removeItem(item: SaleItem): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    const confirmed = confirm(`¿Eliminar ${item.productName} de la cuenta?`);

    if (!confirmed) {
      return;
    }

    this.salesService.removeItem(currentSale.id, item.id).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
      },

      error: (error) => {
        console.error(error);

        this.itemActionError.set(error?.error?.detail ?? 'No fue posible eliminar la partida');
      },
    });
  }

  increaseQuantity(item: SaleItem): void {
    this.updateQuantity(item, item.quantity + 1);
  }

  decreaseQuantity(item: SaleItem): void {
    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      return;
    }

    this.updateQuantity(item, newQuantity);
  }

  private loadCustomers(): void {
    this.customerService.findActive().subscribe({
      next: (customers) => {
        this.customers.set(customers);
      },

      error: (error) => {
        console.error('Error loading customers', error);
        this.customerError.set(error?.error?.detail ?? 'No fue posible cargar los clientes');
      },
    });
  }

  currentCustomer(): Customer | null {
    const customerId = this.sale()?.customerId;

    if (!customerId) {
      return null;
    }

    return this.customers().find((customer) => customer.id === customerId) ?? null;
  }

  startCustomerSelection(): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.selectedCustomerId.set(currentSale.customerId ?? null);

    this.customerError.set('');
    this.showCustomerSelector.set(true);
  }

  cancelCustomerSelection(): void {
    this.showCustomerSelector.set(false);
    this.selectedCustomerId.set(null);
    this.customerError.set('');
  }

  assignCustomer(): void {
    const currentSale = this.sale();
    const customerId = this.selectedCustomerId();

    if (!currentSale) {
      return;
    }

    if (!customerId) {
      this.customerError.set('Selecciona un cliente');
      return;
    }

    this.customerLoading.set(true);
    this.customerError.set('');

    this.salesService.assignCustomer(currentSale.id, customerId).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.customerLoading.set(false);
        this.cancelCustomerSelection();
      },

      error: (error) => {
        console.error(error);

        this.customerError.set(error?.error?.detail ?? 'No fue posible asignar el cliente');

        this.customerLoading.set(false);
      },
    });
  }

  removeCustomer(): void {
    const currentSale = this.sale();

    if (!currentSale?.customerId) {
      return;
    }

    this.customerLoading.set(true);
    this.customerError.set('');

    this.salesService.removeCustomer(currentSale.id).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.customerLoading.set(false);
        this.cancelCustomerSelection();
      },

      error: (error) => {
        console.error(error);

        this.customerError.set(error?.error?.detail ?? 'No fue posible quitar el cliente');

        this.customerLoading.set(false);
      },
    });
  }

  startPayment(): void {
    this.showCreditClose.set(false);
    this.showPayment.set(true);
  }

  cancelPayment(): void {
    this.showPayment.set(false);
  }

  onSalePaid(updatedSale: SaleDetail): void {
    this.sale.set(updatedSale);
    this.showPayment.set(false);
    this.router.navigate(['/sales']);
  }

  closeAsCredit(): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    if (!currentSale.customerId) {
      this.creditError.set('Debes asignar un cliente antes de cerrar a crédito');
      return;
    }

    if (currentSale.total <= 0) {
      this.creditError.set('La cuenta debe tener un total mayor a cero');
      return;
    }

    this.creditError.set('');

    this.showPayment.set(false);
    this.showCreditClose.set(true);
  }

  cancelCreditClose(): void {
    this.showCreditClose.set(false);
  }

  onCreditClosed(updatedSale: SaleDetail): void {
    this.sale.set(updatedSale);

    this.showCreditClose.set(false);

    this.router.navigate(['/sales']);
  }

  startCancelSale(): void {
    this.cancelReason.set('');
    this.cancelSaleError.set('');
    this.showCancelSale.set(true);
  }

  closeCancelSale(): void {
    if (this.cancellingSale()) {
      return;
    }

    this.showCancelSale.set(false);
    this.cancelReason.set('');
    this.cancelSaleError.set('');
  }

  confirmCancelSale(): void {
    const currentSale = this.sale();
    const reason = this.cancelReason().trim();

    if (!currentSale || this.cancellingSale()) {
      return;
    }

    if (!reason) {
      this.cancelSaleError.set('Captura el motivo de cancelación');
      return;
    }

    this.cancellingSale.set(true);
    this.cancelSaleError.set('');

    this.salesService.cancelSale(currentSale.id, reason).subscribe({
      next: () => {
        this.cancellingSale.set(false);
        this.showCancelSale.set(false);

        this.router.navigate(['/sales']);
      },

      error: (error) => {
        console.error('Error cancelling sale', error);

        this.cancelSaleError.set(error?.error?.detail ?? 'No fue posible cancelar la cuenta');

        this.cancellingSale.set(false);
      },
    });
  }

  private updateQuantity(item: SaleItem, quantity: number): void {
    const currentSale = this.sale();

    if (!currentSale) {
      return;
    }

    this.salesService.changeItemQuantity(currentSale.id, item.id, quantity).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
      },

      error: (error) => {
        console.error(error);

        this.itemActionError.set(error?.error?.detail ?? 'No fue posible cambiar la cantidad');
      },
    });
  }

  viewCustomerAccount(): void {
    const customerId = this.sale()?.customerId;

    if (!customerId) {
      return;
    }

    this.router.navigate(['/customers', customerId, 'receivables']);
  }

  private loadOtherOpenSales(): void {
    const currentSaleId = this.sale()?.id;

    if (!currentSaleId) {
      return;
    }

    this.salesService.findOpen().subscribe({
      next: (sales) => {
        this.otherOpenSales.set(sales.filter((sale) => sale.id !== currentSaleId));
      },

      error: (error) => {
        console.error('Error loading other open sales', error);

        this.otherOpenSales.set([]);
      },
    });
  }

  startMoveItem(item: SaleItem): void {
    this.movingItemId.set(item.id);
    this.selectedTargetSaleId.set(null);
    this.splitQuantity.set(null);
    this.moveError.set('');
  }

  cancelMoveItem(): void {
    this.movingItemId.set(null);
    this.selectedTargetSaleId.set(null);
    this.splitQuantity.set(null);
    this.moveError.set('');
  }

  moveWholeItem(item: SaleItem): void {
    const currentSale = this.sale();
    const targetSaleId = this.selectedTargetSaleId();

    if (!currentSale || !targetSaleId) {
      this.moveError.set('Selecciona una cuenta destino');
      return;
    }

    this.moveError.set('');
    this.itemCommercialActionLoading.set(true);

    this.salesService.moveItem(currentSale.id, item.id, targetSaleId).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);

        this.movingItemId.set(null);
        this.selectedTargetSaleId.set(null);

        this.loadOtherOpenSales();

        this.itemCommercialActionLoading.set(false);
      },

      error: (error) => {
        console.error('Error moving sale item', error);

        this.moveError.set('No fue posible mover la partida');

        this.itemCommercialActionLoading.set(false);
      },
    });
  }

  movePartialItem(item: SaleItem): void {
    const currentSale = this.sale();
    const targetSaleId = this.selectedTargetSaleId();
    const quantity = this.splitQuantity();

    if (!currentSale || !targetSaleId) {
      this.moveError.set('Selecciona una cuenta destino');
      return;
    }

    if (quantity === null || quantity <= 0) {
      this.moveError.set('Ingresa una cantidad válida');
      return;
    }

    if (quantity >= item.quantity) {
      this.moveError.set('La cantidad a mover debe ser menor a la cantidad de la partida');
      return;
    }

    if (item.discountType === 'AMOUNT') {
      this.moveError.set('Una partida con descuento fijo solo puede moverse completa');
      return;
    }

    this.moveError.set('');
    this.itemCommercialActionLoading.set(true);

    this.salesService.splitItem(currentSale.id, item.id, targetSaleId, quantity).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);

        this.movingItemId.set(null);
        this.selectedTargetSaleId.set(null);
        this.splitQuantity.set(null);

        this.loadOtherOpenSales();

        this.itemCommercialActionLoading.set(false);
      },

      error: (error) => {
        console.error('Error partially moving sale item', error);

        this.moveError.set('No fue posible mover la cantidad');

        this.itemCommercialActionLoading.set(false);
      },
    });
  }

  createSale(): void {
    if (this.creatingSale()) {
      return;
    }

    this.creatingSale.set(true);
    this.newSaleError.set('');

    this.cashService.findCurrent().subscribe({
      next: (cashSession) => {
        if (!cashSession) {
          this.creatingSale.set(false);

          this.newSaleError.set('No hay una caja abierta.');

          return;
        }

        const reference = this.newSaleReference().trim();

        this.salesService
          .openSale({
            cashSessionId: cashSession.id,

            reference: reference || null,

            customerId: this.newSaleCustomerId(),
          })
          .subscribe({
            next: (sale) => {
              this.creatingSale.set(false);

              this.cancelNewSale();

              this.router.navigate(['/sales', sale.id]);
            },

            error: (error) => {
              console.error('Error opening sale', error);

              this.creatingSale.set(false);

              this.newSaleError.set(error?.error?.detail ?? 'No fue posible abrir la cuenta');
            },
          });
      },

      error: (error) => {
        console.error('Error loading current cash session', error);

        this.creatingSale.set(false);

        this.newSaleError.set('No fue posible consultar la caja actual');
      },
    });
  }

  openSales(): Sale[] {
    const current = this.sale();
    const sales = current ? [current, ...this.otherOpenSales()] : this.otherOpenSales();

    return Array.from(new Map(sales.map((sale) => [sale.id, sale])).values()).sort(
      (a, b) => a.saleNumber - b.saleNumber,
    );
  }

  private loadSale(saleId: string, initialLoad = true): void {
    this.salesService.findById(saleId).subscribe({
      next: (sale) => {
        this.sale.set(sale);

        if (!initialLoad && sale.status !== 'OPEN') {
          this.router.navigate(['/sales']);
          return;
        }

        if (initialLoad) {
          this.loading.set(false);
          this.loadOtherOpenSales();
        }
      },

      error: (error) => {
        console.error('Error loading sale', error);

        if (initialLoad) {
          this.error.set('No fue posible cargar la cuenta');

          this.loading.set(false);
        }
      },
    });
  }
}
