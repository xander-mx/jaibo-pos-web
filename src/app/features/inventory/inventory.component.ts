import { Component, OnInit, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InventoryItem } from '@core/models/inventory';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  readonly items = signal<InventoryItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly editingProductId = signal<string | null>(null);
  readonly adjustmentQuantity = signal<number | null>(null);
  readonly adjustmentReason = signal('');
  readonly adjustmentLoading = signal(false);
  readonly adjustmentError = signal('');
  readonly wastingProductId = signal<string | null>(null);
  readonly wasteQuantity = signal<number | null>(null);
  readonly wasteReason = signal('');
  readonly wasteLoading = signal(false);
  readonly wasteError = signal('');

  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading.set(true);
    this.error.set('');

    this.inventoryService.findAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },

      error: (error) => {
        console.error('Error loading inventory', error);

        this.error.set(error?.error?.detail ?? 'No fue posible cargar el inventario');

        this.loading.set(false);
      },
    });
  }

  startAdjustment(item: InventoryItem): void {
    this.editingProductId.set(item.productId);

    this.adjustmentQuantity.set(item.quantity);

    this.adjustmentReason.set('');
    this.adjustmentError.set('');
  }

  cancelAdjustment(): void {
    if (this.adjustmentLoading()) {
      return;
    }

    this.editingProductId.set(null);
    this.adjustmentQuantity.set(null);
    this.adjustmentReason.set('');
    this.adjustmentError.set('');
  }

  saveAdjustment(item: InventoryItem): void {
    const quantity = this.adjustmentQuantity();
    const reason = this.adjustmentReason().trim();

    if (quantity === null) {
      this.adjustmentError.set('Captura la existencia');
      return;
    }

    if (Number(quantity) === Number(item.quantity)) {
      this.adjustmentError.set('La nueva existencia debe ser distinta a la registrada');
      return;
    }

    if (!reason) {
      this.adjustmentError.set('Captura el motivo del ajuste');
      return;
    }

    this.adjustmentLoading.set(true);
    this.adjustmentError.set('');

    this.inventoryService
      .adjustQuantity(item.productId, {
        quantity,
        reason: reason || null,
      })
      .subscribe({
        next: (updatedItem) => {
          this.items.update((items) =>
            items.map((current) =>
              current.productId === updatedItem.productId ? updatedItem : current,
            ),
          );

          this.adjustmentLoading.set(false);

          this.cancelAdjustment();
        },

        error: (error) => {
          console.error('Error adjusting inventory', error);

          this.adjustmentError.set(error?.error?.detail ?? 'No fue posible ajustar el inventario');

          this.adjustmentLoading.set(false);
        },
      });
  }

  startWaste(item: InventoryItem): void {
    this.wastingProductId.set(item.productId);

    this.wasteQuantity.set(null);
    this.wasteReason.set('');
    this.wasteError.set('');
  }

  cancelWaste(): void {
    if (this.wasteLoading()) {
      return;
    }

    this.wastingProductId.set(null);
    this.wasteQuantity.set(null);
    this.wasteReason.set('');
    this.wasteError.set('');
  }

  saveWaste(item: InventoryItem): void {
    const quantity = this.wasteQuantity();

    if (quantity === null || quantity <= 0) {
      this.wasteError.set('Captura una cantidad mayor a cero');
      return;
    }

    this.wasteLoading.set(true);
    this.wasteError.set('');

    const reason = this.wasteReason().trim();

    this.inventoryService
      .registerWaste(item.productId, {
        quantity,
        reason: reason || null,
      })
      .subscribe({
        next: (updatedItem) => {
          this.items.update((items) =>
            items.map((current) =>
              current.productId === updatedItem.productId ? updatedItem : current,
            ),
          );

          this.wasteLoading.set(false);
          this.cancelWaste();
        },

        error: (error) => {
          console.error('Error registering waste', error);

          this.wasteError.set(error?.error?.detail ?? 'No fue posible registrar la merma');

          this.wasteLoading.set(false);
        },
      });
  }

  adjustmentDifference(item: InventoryItem): number {
    const value = this.adjustmentQuantity();

    if (value === null) {
      return 0;
    }

    return Number(value) - Number(item.quantity);
  }

  canSaveAdjustment(item: InventoryItem): boolean {
    const value = this.adjustmentQuantity();
    const reason = this.adjustmentReason().trim();

    if (value === null) {
      return false;
    }

    return (
      Number(value) !== Number(item.quantity) && reason.length > 0 && !this.adjustmentLoading()
    );
  }
}
