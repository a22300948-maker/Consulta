import { Component } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Products } from '../../models/producto.model';

@Component({
  selector: 'app-carrito',
  standalone: true,
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {

  products: Products[] = [];

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService
  ) {
    this.products = this.productoService.getCart();
  }

  generateXML() {
    this.carritoService.generateXML(this.products)
  }
}
