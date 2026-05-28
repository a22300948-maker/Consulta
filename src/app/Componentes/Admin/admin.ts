import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Products } from '../../Modelos/producto.model';
import { AdminService } from '../../Servicios/admin.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { AdminProductModalComponent, AdminProductModalResult } from '../AdminProductModal/admin-product-modal';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, AdminProductModalComponent],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = true;
  errorMessage = '';
  actionMessage = '';

  products: Products[] = [];
  selectedProduct: Products | null = null;
  modalOpen = false;
  modalLoading = false;
  deleteConfirmOpen = false;

  stockDraft: Record<number, string> = {};
  saving: Record<number, boolean> = {};
  statusMsg: Record<number, string> = {};
  private statusTimeoutId: Record<number, number> = {};

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    Object.values(this.statusTimeoutId).forEach((id) => clearTimeout(id));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openCreateModal() {
    this.selectedProduct = null;
    this.modalOpen = true;
    this.actionMessage = '';
    this.zone.run(() => this.cdr.markForCheck());
  }

  openEditModal(product: Products) {
    this.selectedProduct = { ...product };
    this.modalOpen = true;
    this.actionMessage = '';
    this.zone.run(() => this.cdr.markForCheck());
  }

  toggleProductActive(product: Products) {
    const nextActive = !(product.isActive === 1);
    const actionLabel = nextActive ? 'regresar' : 'quitar';

    this.zone.run(() => {
      this.actionMessage = '';
      this.statusMsg[product.id] = nextActive ? 'Reactivando...' : 'Desactivando...';
      this.cdr.markForCheck();
    });

    const sub = this.adminService.setProductActive(product.id, nextActive).subscribe({
      next: (updated) => {
        this.zone.run(() => {
          this.products = this.products.map((p) => (p.id === updated.id ? updated : p));
          this.stockDraft[updated.id] = String(typeof updated.inStock === 'number' ? updated.inStock : 0);
          this.clearStatus(updated.id);
          this.actionMessage = nextActive
            ? `Producto "${updated.name}" regresó a la plataforma.`
            : `Producto "${updated.name}" fue quitado de la plataforma.`;
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.clearStatus(product.id);
          this.errorMessage = err?.error?.error || `No se pudo ${actionLabel} el producto.`;
          this.cdr.markForCheck();
        });
      },
    });

    this.subs.push(sub);
  }

  closeProductModal() {
    if (this.modalLoading) return;
    this.modalOpen = false;
    this.deleteConfirmOpen = false;
    this.selectedProduct = null;
    this.zone.run(() => this.cdr.markForCheck());
  }

  saveProduct(payload: AdminProductModalResult) {
    const isEdit = !!this.selectedProduct?.id;
    this.modalLoading = true;
    this.actionMessage = '';
    this.zone.run(() => this.cdr.markForCheck());

    const request$ = isEdit
      ? this.adminService.updateProduct(this.selectedProduct!.id, payload)
      : this.adminService.createProduct(payload);

    const sub = request$.subscribe({
      next: (saved) => {
        this.zone.run(() => {
          if (isEdit) {
            this.products = this.products.map((p) => (p.id === saved.id ? saved : p));
            this.actionMessage = `Producto "${saved.name}" actualizado.`;
          } else {
            this.products = [saved, ...this.products];
            this.actionMessage = `Producto "${saved.name}" creado.`;
          }

          this.stockDraft[saved.id] = String(typeof saved.inStock === 'number' ? saved.inStock : 0);
          this.modalOpen = false;
          this.deleteConfirmOpen = false;
          this.selectedProduct = null;
          this.modalLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.modalLoading = false;
          this.actionMessage = '';
          this.errorMessage = err?.error?.error || err?.error?.message || 'No se pudo guardar el producto.';
          this.cdr.markForCheck();
        });
      },
    });

    this.subs.push(sub);
  }

  askDeleteProduct() {
    if (!this.selectedProduct) return;
    this.deleteConfirmOpen = true;
    this.zone.run(() => this.cdr.markForCheck());
  }

  cancelDelete() {
    this.deleteConfirmOpen = false;
    this.zone.run(() => this.cdr.markForCheck());
  }

  confirmDeleteProduct() {
    if (!this.selectedProduct) return;

    const productId = this.selectedProduct.id;
    const productName = this.selectedProduct.name;
    const nextActive = !(this.selectedProduct.isActive === 1);
    this.modalLoading = true;
    this.zone.run(() => this.cdr.markForCheck());

    const sub = this.adminService.setProductActive(productId, nextActive).subscribe({
      next: () => {
        this.zone.run(() => {
          this.products = this.products.map((p) => (p.id === productId ? { ...p, isActive: nextActive ? 1 : 0 } : p));
          this.selectedProduct = null;
          this.modalOpen = false;
          this.deleteConfirmOpen = false;
          this.modalLoading = false;
          this.actionMessage = nextActive
            ? `Producto "${productName}" regresó a la plataforma.`
            : `Producto "${productName}" fue quitado de la plataforma.`;
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.modalLoading = false;
          this.errorMessage = err?.error?.error || err?.error?.message || `No se pudo ${nextActive ? 'regresar' : 'quitar'} el producto.`;
          this.cdr.markForCheck();
        });
      },
    });

    this.subs.push(sub);
  }

  private clearStatus(productId: number) {
    const t = this.statusTimeoutId[productId];
    if (t) {
      clearTimeout(t);
      delete this.statusTimeoutId[productId];
    }
    this.statusMsg[productId] = '';
  }

  private autoClearStatusAfter(productId: number, ms: number) {
    const id = window.setTimeout(() => {
      this.zone.run(() => {
        this.clearStatus(productId);
        this.cdr.markForCheck();
      });
    }, ms);
    this.statusTimeoutId[productId] = id;
  }

  private loadProducts() {
    this.loading = true;
    this.errorMessage = '';
    this.actionMessage = '';

    const sub = this.adminService.getAllAdminProducts().subscribe({
      next: (products) => {
        this.zone.run(() => {
          this.products = products || [];
          this.products.forEach(p => {
            this.stockDraft[p.id] = String(typeof p.inStock === 'number' ? p.inStock : 0);
          });
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.errorMessage = err?.error?.error || 'No se pudieron cargar los productos.';
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      complete: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });

    this.subs.push(sub);
  }

  onStockInput(productId: number, ev: Event) {
    const el = ev.target as HTMLInputElement;
    const cleaned = (el.value || '').replace(/\D+/g, '');
    el.value = cleaned;
    this.stockDraft[productId] = cleaned;
    this.zone.run(() => {
      this.clearStatus(productId);
      this.cdr.markForCheck();
    });
  }

  saveStock(product: Products) {
    const raw = this.stockDraft[product.id] ?? String(product.inStock ?? 0);
    const nextStock = raw === '' ? 0 : parseInt(raw, 10);

    if (!Number.isFinite(nextStock) || nextStock < 0) {
      this.zone.run(() => {
        this.clearStatus(product.id);
        this.statusMsg[product.id] = 'Stock inválido.';
        this.cdr.markForCheck();
      });
      return;
    }

    this.zone.run(() => {
      this.saving[product.id] = true;
      this.clearStatus(product.id);
      this.statusMsg[product.id] = 'Guardando...';
      this.cdr.markForCheck();
    });

    const sub = this.adminService.updateProductStock(product.id, nextStock).subscribe({
      next: (updated) => {
        this.zone.run(() => {
          this.products = this.products.map(p => (p.id === updated.id ? updated : p));
          this.stockDraft[product.id] = String(updated.inStock);
          this.clearStatus(product.id);
          this.statusMsg[product.id] = 'Guardado.';
          this.autoClearStatusAfter(product.id, 2000);
          this.cdr.markForCheck();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.clearStatus(product.id);
          this.statusMsg[product.id] = err?.error?.error || 'No se pudo guardar el stock.';
          this.saving[product.id] = false;
          this.cdr.markForCheck();
        });
      },
      complete: () => {
        this.zone.run(() => {
          this.saving[product.id] = false;
          this.cdr.markForCheck();
        });
      }
    });

    this.subs.push(sub);
  }

  trackByProductId(_: number, product: Products) {
    return product.id;
  }
}
