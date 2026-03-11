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

    @Output() add = new EventEmitter<Products>();

    addToCart(){
        this.add.emit(this.products);
    }

}