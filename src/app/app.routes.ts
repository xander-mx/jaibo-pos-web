import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sales/sales.component').then((m) => m.SalesComponent),
  },
  {
    path: 'sales/:saleId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sales/sale-detail.component').then((m) => m.SaleDetailComponent),
  },
  {
    path: '',
    redirectTo: 'sales',
    pathMatch: 'full',
  },
  {
    path: 'customers/:customerId/receivables',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/customers/customer-receivables.component').then(
        (m) => m.CustomerReceivablesComponent,
      ),
  },
  {
    path: 'customers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'cash',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/cash/cash-session.component').then((m) => m.CashSessionComponent),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('@features/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'suppliers',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('@features/suppliers/suppliers.component').then((m) => m.SuppliersComponent),
  },
  {
    path: 'purchases',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('@features/purchases/purchases.component').then((m) => m.PurchasesComponent),
  },
  {
    path: 'purchases/:purchaseId',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('@features/purchases/purchase-detail.component').then(
        (m) => m.PurchaseDetailComponent,
      ),
  },
  {
    path: 'catalog',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('@features/catalog/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: '**',
    redirectTo: 'sales',
  },
];
