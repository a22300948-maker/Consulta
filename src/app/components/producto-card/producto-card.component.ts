import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Products } from '../../models/producto.model';

@Component({
    selector: 'app-producto-card',
    standalone: true,
    templateUrl: './producto-card.component.html',
    styleUrl: './producto-card.component.css'
})
export class ProductoCardComponent {

    @Input({ required: true }) products!: Products;

    @Output() add = new EventEmitter<{ product: Products; quantity: number }>();

    // Cantidad seleccionada por el usuario (por defecto 1)
    quantity = 1;

    increase() {
        if (this.quantity < 999) this.quantity++;
    }

    decrease() {
        if (this.quantity > 1) this.quantity--;
    }

    addToCart(){
        this.add.emit({ product: this.products, quantity: this.quantity });
    }

    // Modal para mostrar detalles del producto
    showModal = false;

    openModal() {
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

}