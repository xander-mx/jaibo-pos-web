import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogService, InventoryMode } from '../catalog.service';
import { Category } from '@core/models/category';
import { Product } from '@core/models/product';
import { Unit } from '@core/models/unit';
import { ProductPresentation } from '@core/models/product-presentation';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly units = signal<Unit[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');

  readonly showCreateProduct = signal(false);
  readonly showCreateCategory = signal(false);

  readonly creatingProduct = signal(false);
  readonly creatingCategory = signal(false);

  readonly productError = signal('');
  readonly categoryError = signal('');

  readonly name = signal('');
  readonly description = signal('');
  readonly categoryId = signal('');

  readonly inventoryMode = signal<InventoryMode>('DIRECT');

  readonly inventoryUnitId = signal<string | null>(null);

  readonly sellable = signal(true);
  readonly purchasable = signal(true);

  readonly displayOrder = signal<number | null>(0);

  readonly categoryName = signal('');
  readonly categoryDisplayOrder = signal<number | null>(0);
  readonly selectedProduct = signal<Product | null>(null);
  readonly presentations = signal<ProductPresentation[]>([]);

  readonly presentationsLoading = signal(false);
  readonly presentationError = signal('');

  readonly showCreatePresentation = signal(false);
  readonly creatingPresentation = signal(false);

  readonly presentationName = signal('');
  readonly presentationUnitId = signal('');

  readonly conversionFactor = signal<number | null>(1);

  readonly salePrice = signal<number | null>(null);

  readonly priceBasisQuantity = signal<number | null>(1);

  readonly variableQuantity = signal(false);

  readonly minimumQuantity = signal<number | null>(null);

  readonly openPrice = signal(false);

  readonly presentationDisplayOrder = signal<number | null>(0);

  constructor(private readonly catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadCatalog();
  }

  openCreateProduct(): void {
    this.resetProductForm();

    this.showCreateProduct.set(true);
  }

  cancelCreateProduct(): void {
    this.showCreateProduct.set(false);

    this.resetProductForm();
  }

  openCreateCategory(): void {
    this.categoryName.set('');
    this.categoryDisplayOrder.set(0);
    this.categoryError.set('');

    this.showCreateCategory.set(true);
  }

  cancelCreateCategory(): void {
    this.showCreateCategory.set(false);
    this.categoryError.set('');
  }

  changeInventoryMode(mode: InventoryMode): void {
    this.inventoryMode.set(mode);

    if (mode === 'NOT_TRACKED') {
      this.inventoryUnitId.set(null);
    }
  }

  createProduct(): void {
    const name = this.name().trim();
    const categoryId = this.categoryId();

    if (!name) {
      this.productError.set('Captura el nombre del producto');
      return;
    }

    if (!categoryId) {
      this.productError.set('Selecciona una categoría');
      return;
    }

    if (this.inventoryMode() !== 'NOT_TRACKED' && !this.inventoryUnitId()) {
      this.productError.set('Selecciona la unidad de inventario');

      return;
    }

    this.creatingProduct.set(true);
    this.productError.set('');

    this.catalogService
      .createProduct({
        categoryId,
        inventoryUnitId: this.inventoryMode() === 'NOT_TRACKED' ? null : this.inventoryUnitId(),

        name,
        description: this.description().trim() || null,

        imageUrl: null,

        inventoryMode: this.inventoryMode(),

        sellable: this.sellable(),

        purchasable: this.purchasable(),

        displayOrder: this.displayOrder(),
      })
      .subscribe({
        next: () => {
          this.creatingProduct.set(false);
          this.showCreateProduct.set(false);

          this.resetProductForm();
          this.loadProducts();
        },

        error: (error) => {
          console.error('Error creating product', error);

          this.productError.set(error?.error?.detail ?? 'No fue posible crear el producto');

          this.creatingProduct.set(false);
        },
      });
  }

  createCategory(): void {
    const name = this.categoryName().trim();

    if (!name) {
      this.categoryError.set('Captura el nombre de la categoría');
      return;
    }

    this.creatingCategory.set(true);
    this.categoryError.set('');

    this.catalogService
      .createCategory({
        name,
        displayOrder: this.categoryDisplayOrder(),
      })
      .subscribe({
        next: (category) => {
          this.creatingCategory.set(false);
          this.showCreateCategory.set(false);

          this.categoryId.set(category.id);

          this.loadCategories();
        },

        error: (error) => {
          console.error('Error creating category', error);

          this.categoryError.set(error?.error?.detail ?? 'No fue posible crear la categoría');

          this.creatingCategory.set(false);
        },
      });
  }

  inventoryModeLabel(mode: string): string {
    switch (mode) {
      case 'DIRECT':
        return 'Control directo';

      case 'MANUAL_AT_CLOSE':
        return 'Ajuste manual al cierre';

      case 'NOT_TRACKED':
        return 'Sin control';

      default:
        return mode;
    }
  }

  openPresentations(product: Product): void {
    this.selectedProduct.set(product);
    this.presentationError.set('');

    this.loadPresentations(product.id);
  }

  closePresentations(): void {
    if (this.presentationsLoading() || this.creatingPresentation()) {
      return;
    }

    this.selectedProduct.set(null);
    this.presentations.set([]);
    this.showCreatePresentation.set(false);
    this.presentationError.set('');
  }

  openCreatePresentation(): void {
    this.presentationName.set('');

    this.presentationUnitId.set(this.units()[0]?.id ?? '');

    this.conversionFactor.set(1);
    this.salePrice.set(null);
    this.priceBasisQuantity.set(1);

    this.variableQuantity.set(false);
    this.minimumQuantity.set(null);

    this.openPrice.set(false);
    this.presentationDisplayOrder.set(0);

    this.presentationError.set('');

    this.showCreatePresentation.set(true);
  }

  cancelCreatePresentation(): void {
    this.showCreatePresentation.set(false);
    this.presentationError.set('');
  }

  createPresentation(): void {
    const product = this.selectedProduct();

    if (!product) {
      return;
    }

    const name = this.presentationName().trim();

    if (!name) {
      this.presentationError.set('Captura el nombre de la presentación');
      return;
    }

    if (!this.presentationUnitId()) {
      this.presentationError.set('Selecciona una unidad');
      return;
    }

    const conversionFactor = product.inventoryMode === 'NOT_TRACKED' ? 1 : this.conversionFactor();

    if (conversionFactor === null || conversionFactor <= 0) {
      this.presentationError.set('Captura una equivalencia de inventario válida');
      return;
    }

    const priceBasisQuantity = this.priceBasisQuantity();

    if (priceBasisQuantity === null || priceBasisQuantity < 0.001) {
      this.presentationError.set('Captura una cantidad base válida');
      return;
    }

    if (
      this.variableQuantity() &&
      (this.minimumQuantity() === null || this.minimumQuantity()! < 0.001)
    ) {
      this.presentationError.set('Captura la cantidad mínima');
      return;
    }

    if (!this.openPrice() && this.salePrice() === null) {
      this.presentationError.set('Captura el precio de venta');
      return;
    }

    this.creatingPresentation.set(true);
    this.presentationError.set('');

    this.catalogService
      .createPresentation(product.id, {
        unitId: this.presentationUnitId(),

        name,

        conversionFactor,

        salePrice: this.openPrice() ? null : this.salePrice(),

        priceBasisQuantity,

        variableQuantity: this.variableQuantity(),

        minimumQuantity: this.variableQuantity() ? this.minimumQuantity() : null,

        openPrice: this.openPrice(),

        displayOrder: this.presentationDisplayOrder(),
      })
      .subscribe({
        next: () => {
          this.creatingPresentation.set(false);
          this.showCreatePresentation.set(false);

          this.loadPresentations(product.id);
        },

        error: (error) => {
          console.error('Error creating presentation', error);

          this.presentationError.set(
            error?.error?.detail ?? 'No fue posible crear la presentación',
          );

          this.creatingPresentation.set(false);
        },
      });
  }

  changeOpenPrice(value: boolean): void {
    this.openPrice.set(value);

    if (value) {
      this.salePrice.set(null);
    }
  }

  changeVariableQuantity(value: boolean): void {
    this.variableQuantity.set(value);

    if (!value) {
      this.minimumQuantity.set(null);
    }
  }

  private loadPresentations(productId: string): void {
    this.presentationsLoading.set(true);
    this.presentationError.set('');

    this.catalogService.findPresentations(productId).subscribe({
      next: (presentations) => {
        this.presentations.set(presentations);

        this.presentationsLoading.set(false);
      },

      error: (error) => {
        console.error('Error loading presentations', error);

        this.presentationError.set(
          error?.error?.detail ?? 'No fue posible cargar las presentaciones',
        );

        this.presentationsLoading.set(false);
      },
    });
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalogService.findProducts().subscribe({
      next: (products) => {
        this.products.set(products);

        this.loadCategories();
        this.loadUnits();
      },

      error: (error) => {
        console.error('Error loading products', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar el catálogo');

        this.loading.set(false);
      },
    });
  }

  private loadProducts(): void {
    this.catalogService.findProducts().subscribe({
      next: (products) => {
        this.products.set(products);
      },

      error: (error) => {
        console.error('Error loading products', error);
      },
    });
  }

  private loadCategories(): void {
    this.catalogService.findCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);

        if (!this.categoryId() && categories.length > 0) {
          this.categoryId.set(categories[0].id);
        }
      },

      error: (error) => {
        console.error('Error loading categories', error);
      },
    });
  }

  private loadUnits(): void {
    this.catalogService.findUnits().subscribe({
      next: (units) => {
        this.units.set(units);

        if (!this.inventoryUnitId() && units.length > 0) {
          this.inventoryUnitId.set(units[0].id);
        }

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading units', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar las unidades');

        this.loading.set(false);
      },
    });
  }

  private resetProductForm(): void {
    this.name.set('');
    this.description.set('');

    this.categoryId.set(this.categories()[0]?.id ?? '');

    this.inventoryMode.set('DIRECT');

    this.inventoryUnitId.set(this.units()[0]?.id ?? null);

    this.sellable.set(true);
    this.purchasable.set(true);

    this.displayOrder.set(0);

    this.productError.set('');
  }
}
