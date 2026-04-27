import { Injectable, inject } from '@angular/core';
import { Products } from '../models/producto.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/productos';
  
  getAllFromApi(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl);
  }
  private cart: Products[] = [];

  addToCart(product: Products) {
    this.cart.push(product);
  }

  getCart(): Products[] {
    return this.cart;
  }

  clearCart() {
    this.cart = [];
  }

  // Obtener resumen del carrito (producto, cantidad, subtotal)
  getCartSummary(): { product: Products; quantity: number; subtotal: number }[] {
    const summary = new Map<number, { product: Products; quantity: number }>();
    this.cart.forEach(item => {
      const existing = summary.get(item.id);
      if (existing) {
        existing.quantity++;
      } else {
        summary.set(item.id, { product: item, quantity: 1 });
      }
    });
    return Array.from(summary.values()).map(item => ({
      ...item,
      subtotal: item.product.price * item.quantity
    }));
  }

  // Eliminar todas las ocurrencias de un producto del carrito
  removeProductFromCart(productId: number) {
    this.cart = this.cart.filter(p => p.id !== productId);
  }
}