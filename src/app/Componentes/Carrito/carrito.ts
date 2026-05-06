import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ProductoService } from '../../Servicios/producto.service';
import { CarritoService } from '../../Servicios/carrito.service';
import { Products } from '../../Modelos/producto.model';
import { firstValueFrom } from 'rxjs';
import { PaypalComponent } from '../PayPal/paypal';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [PaypalComponent],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  private productoService = inject(ProductoService);
  private carritoService = inject(CarritoService);
  private cdr = inject(ChangeDetectorRef);

  cartItems: { product: Products; quantity: number; subtotal: number }[] = [];
  paymentError = '';
  paymentSuccess = '';
  overlayOpen = false;

  constructor() {
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
    this.productoService.removeOne(productId);
    this.loadCart(); // refrescar vista
  }

  increaseOne(product: Products) {
    if (!product.inStock) {
      this.productoService.cartNotify$.next(`${product.name} está agotado`);
      return;
    }
    this.productoService.addToCart(product, 1);
    this.loadCart();
  }

  decreaseOne(product: Products) {
    const removed = this.productoService.removeOne(product.id);
    if (removed) {
      this.loadCart();
    }
  }

  confirmRemoveAll(productId: number) {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (!item) return;
    const should = confirm(`Eliminar ${item.quantity} × ${item.product.name} del carrito?`);
    if (!should) return;
    this.productoService.removeProductFromCart(productId);
    this.loadCart();
  }

  confirmClearCart() {
    const should = confirm('¿Vaciar el carrito por completo?');
    if (!should) return;
    this.productoService.clearCart();
    this.loadCart();
  }

  buy() {
    if (this.cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    this.openOverlay();
  }

  openOverlay() {
    this.overlayOpen = true;
    this.cdr.detectChanges();
  }

  closeOverlay() {
    this.overlayOpen = false;
  }

  // Handlers invoked by the child PayPal component
  async onPaypalApproved() {
    // generar XML y limpiar carrito
    this.carritoService.generateXML(this.productoService.getCart());
    this.productoService.clearCart();
    this.paymentSuccess = 'Pago aprobado. Se descargó tu recibo en XML.';
    this.loadCart();
    this.closeOverlay();
  }

  onPaypalError(msg?: string) {
    this.paymentError = msg || 'Ocurrió un error al procesar el pago con PayPal.';
  }
}
