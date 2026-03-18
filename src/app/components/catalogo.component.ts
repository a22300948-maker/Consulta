import { Component } from "@angular/core";
import { ProductoCardComponent } from "./producto-card/producto-card.component";
import { ProductoService } from "../services/producto.service";
import { Products } from "../models/producto.model";
import { RouterOutlet, Router } from "@angular/router";

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {

    products: Products[] = [];
    counter = 0;

    constructor(
        private productoService: ProductoService,
        private router: Router
    ) {
        this.products = this.productoService.getAll();
    }

    goToCart() {
        this.router.navigate(['/carrito']);
    }
    addToCart(product: Products) {
        this.productoService.addToCart(product);
        this.counter++;
    }
}