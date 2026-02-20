import { Component } from "@angular/core";
import { ProductoCardComponent } from "./producto-card/producto-card.component";
import { ProductoService } from "../services/producto.service";
import { Products } from "../models/producto.model";
import { RouterOutlet } from "@angular/router";

@Component
({
    selector: 'app-catalogo',
    standalone: true,
    imports: [ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent
{
    products: Products[] = [];
    constructor(private productoService: ProductoService) {
        this.products = this.productoService.getAll();
    }
}
