import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Products } from '../../Modelos/producto.model';
import { AdminService } from '../../Servicios/admin.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
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

  products: Products[] = [];

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

    const sub = this.adminService.getAllProducts().subscribe({
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
}
