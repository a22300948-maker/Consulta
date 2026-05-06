import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Products } from '../../Modelos/producto.model';
import { ProductoService } from '../../Servicios/producto.service';
import { ModalService } from '../../Servicios/modal.service';

@Component({
    selector: 'app-producto-card',
    standalone: true,
    templateUrl: './producto-card.html',
    styleUrl: './producto-card.css'
})
export class ProductoCardComponent implements OnInit, OnDestroy {

    @Input({ required: true }) products!: Products;

    private productoService = inject(ProductoService);
    private modalService = inject(ModalService);
    private subs: Subscription[] = [];

    countInCart = 0;

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
        if (!this.products.inStock) {
            this.productoService.cartNotify$.next(`${this.products.name} está agotado`);
            return;
        }
        // silent add (no toast)
        this.productoService.addToCart(this.products, 1, false);
    }

    decrease() {
        if (this.countInCart <= 0) return;
        // silent remove (no toast)
        this.productoService.removeOne(this.products.id, false);
    }

    openDetail() {
        this.modalService.open(this.products);
    }

}
