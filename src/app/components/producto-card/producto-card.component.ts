import { Component, Input } from '@angular/core';
import { Products } from '../../models/producto.model';

@Component({
    selector: 'app-producto-card',
    standalone: true,
    imports: [],
    templateUrl: './producto-card.component.html',
    styleUrl: './producto-card.component.css'
})
export class ProductoCardComponent {
    @Input({required:true}) products!: Products;
}