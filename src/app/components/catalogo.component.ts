import { AsyncPipe } from '@angular/common';
import { Component, inject } from "@angular/core";
import { ProductoCardComponent } from "./producto-card/producto-card.component";
import { ProductoService } from "../services/producto.service";
import { Products } from "../models/producto.model";
import { RouterOutlet, Router } from "@angular/router";
import { Observable } from 'rxjs';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [AsyncPipe, ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {

    private productoService = inject(ProductoService);
    private router = inject(Router);

    products$: Observable<Products[]> = this.productoService.getAllFromApi();
    counter = 0;

    goToCart() {
        this.router.navigate(['/carrito']);
    }
    addToCart(product: Products) {
        this.productoService.addToCart(product);
        this.counter++;
    }
}