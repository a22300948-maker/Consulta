import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Products } from '../../Modelos/producto.model';
import { ProductoService } from '../../Servicios/producto.service';
import { ModalService } from '../../Servicios/modal.service';

@Component({
    selector: 'app-producto-card',
    standalone: true,
    templateUrl: './producto-card.html',
    styleUrl: './producto-card.css',
    imports: [CommonModule]
})
export class ProductoCardComponent implements OnInit, OnDestroy {

    @Input({ required: true }) products!: Products;

    private productoService = inject(ProductoService);
    private modalService = inject(ModalService);
    private subs: Subscription[] = [];

    countInCart = 0;
    private pendingQty: string | null = null;

    ngOnInit(): void {
        this.updateCount();
        this.subs.push(this.productoService.cartChanged$.subscribe(() => this.updateCount()));
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    private updateCount() {
        const all = this.productoService.getCart();
        this.countInCart = all.filter(p => p.id === this.products.id).length;
    }

    increase() {
        const stock = typeof this.products.inStock === 'number' ? this.products.inStock : 0;
        if (stock <= 0) {
            this.productoService.cartNotify$.next(`${this.products.name} está agotado`);
            return;
        }
        // silent add (no toast)
        this.productoService.addToCart(this.products, 1, false);
    }

    decrease() {
        if (this.countInCart <= 0) return;
        // If only one left, confirm before removing
        if (this.countInCart <= 1) {
            const should = confirm(`Eliminar la última unidad de ${this.products.name}?`);
            if (!should) return;
            this.productoService.removeOne(this.products.id, true);
            return;
        }
        // silent remove (no toast)
        this.productoService.removeOne(this.products.id, false);
    }

    onQtyInput(ev: Event) {
        const el = ev.target as HTMLInputElement;
        const cleaned = (el.value || '').replace(/\D+/g, '');
        el.value = cleaned;
        this.pendingQty = cleaned;
        this.countInCart = cleaned === '' ? 0 : parseInt(cleaned, 10);
    }

    onQtyCommit() {
        const q = this.pendingQty !== null ? (parseInt(this.pendingQty, 10) || 0) : this.countInCart;
        const newQty = Math.max(0, q);
        if (newQty === 0) {
            const should = confirm(`Eliminar ${this.products.name} del carrito por completo?`);
            if (!should) {
                // restore count
                this.updateCount();
                this.pendingQty = null;
                return;
            }
        }
        this.productoService.setProductQuantity(this.products, newQty);
        this.pendingQty = null;
    }

    openDetail() {
        this.modalService.open(this.products);
    }

    get truncatedDesc() {
        // Prefer short description field when available
        const text = this.products?.sDescription || this.products?.description || '';
        const max = 90;
        if (text.length <= max) return text;
        return text.slice(0, max).trim() + '...';
    }

}
