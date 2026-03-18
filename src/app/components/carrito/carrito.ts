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

  cartItems: { product: Products; quantity: number; subtotal: number }[] = [];

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService
  ) {
    this.loadCart();
  }

  loadCart() {
    this.cartItems = this.productoService.getCartSummary();
  }

  get total(): number {
    return this.cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get iva(): number {
    return this.total * 0.16; // 16% de IVA
  }

  removeItem(productId: number) {
    this.productoService.removeProductFromCart(productId);
    this.loadCart(); // refrescar vista
  }

  buy() {
    if (this.cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    const confirmed = confirm('¿Confirmas la compra?');
    if (confirmed) {
      // Generar XML con el carrito actual (lista plana con duplicados)
      this.carritoService.generateXML(this.productoService.getCart());
    }
  }
}