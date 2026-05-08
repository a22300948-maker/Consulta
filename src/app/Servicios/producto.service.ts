import { Injectable, inject } from '@angular/core';
import { Products } from '../Modelos/producto.model';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/productos';
  // Emite eventos cuando se añaden productos al carrito
  public cartAdd$ = new Subject<{ product: Products; quantity: number }>();
  // Notificaciones generales (añadir, eliminar, vaciar)
  public cartNotify$ = new Subject<string>();
  // Emite cuando cambia el contenido del carrito (añadir/quitar/vaciar)
  public cartChanged$ = new Subject<void>();
  // Key localStorage
  private storageKey = 'walmart_romano_cart_v1';
  
  getAllFromApi(): Observable<Products[]> {
    return this.http.get<Products[]>(this.apiUrl);
  }
  private cart: Products[] = [];

  constructor() {
    this.loadCartFromStorage();
  }

  /**
   * Añade `quantity` unidades del producto al carrito.
   * Emite un evento en `cartAdd$` para notificaciones.
   */
  addToCart(product: Products, quantity = 1, notify = true) {
    // No permitir añadir si no hay stock (inStock es número)
    const stock = typeof product.inStock === 'number' ? product.inStock : 0;
    if (stock <= 0) {
      if (notify) this.cartNotify$.next(`${product.name} está agotado`);
      return;
    }

    const current = this.cart.filter(p => p.id === product.id).length;
    const available = Math.max(0, stock - current);
    if (available <= 0) {
      if (notify) this.cartNotify$.next(`${product.name} no tiene unidades disponibles`);
      return;
    }

    const toAdd = Math.min(quantity, available);
    for (let i = 0; i < toAdd; i++) {
      this.cart.push(product);
    }
    this.saveCartToStorage();
    this.cartAdd$.next({ product, quantity: toAdd });
    if (notify) {
      if (toAdd < quantity) this.cartNotify$.next(`${toAdd} × ${product.name} añadido (límite de stock)`);
      else this.cartNotify$.next(`${toAdd} × ${product.name} añadido`);
    }
    this.cartChanged$.next();
  }

  getCart(): Products[] {
    return this.cart;
  }

  clearCart() {
    this.cart = [];
    this.saveCartToStorage();
    this.cartNotify$.next('Carrito vaciado');
    this.cartChanged$.next();
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
  removeProductFromCart(productId: number, notify = true) {
    const before = this.cart.length;
    const toRemove = this.cart.filter(p => p.id === productId).length;
    this.cart = this.cart.filter(p => p.id !== productId);
    if (toRemove > 0) {
      this.saveCartToStorage();
      if (notify) this.cartNotify$.next(`${toRemove} × elemento(s) eliminados`);
      this.cartChanged$.next();
    }
  }

  /**
   * Elimina una unidad del producto (si existe) del carrito.
   * Retorna `true` si se eliminó algo.
   */
  removeOne(productId: number, notify = true): boolean {
    const idx = this.cart.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    this.cart.splice(idx, 1);
    this.saveCartToStorage();
    if (notify) this.cartNotify$.next(`1 × elemento eliminado`);
    this.cartChanged$.next();
    return true;
  }

  /**
   * Establece la cantidad exacta para un producto en el carrito.
   * Si `quantity` es 0 elimina el producto por completo.
   */
  setProductQuantity(product: Products, quantity: number, notify = true) {
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      return;
    }
    if (quantity < 0) quantity = 0;
    const current = this.cart.filter(p => p.id === product.id).length;
    if (quantity === current) return;
    if (quantity === 0) {
      this.removeProductFromCart(product.id, notify);
      return;
    }
    const stock = typeof product.inStock === 'number' ? product.inStock : 0;
    const allowedQty = Math.min(quantity, stock);

    if (allowedQty === current) return;

    if (allowedQty > current) {
      const toAdd = allowedQty - current;
      for (let i = 0; i < toAdd; i++) {
        this.cart.push(product);
      }
    } else {
      let toRemove = current - allowedQty;
      while (toRemove > 0) {
        const idx = this.cart.findIndex(p => p.id === product.id);
        if (idx === -1) break;
        this.cart.splice(idx, 1);
        toRemove--;
      }
    }
    this.saveCartToStorage();
    if (notify) this.cartNotify$.next(`Cantidad actualizada: ${quantity} × ${product.name}`);
    this.cartChanged$.next();
  }

  private saveCartToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    } catch (err) {
      console.warn('No se pudo guardar el carrito en localStorage', err);
    }
  }

  private loadCartFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Products[];
        if (Array.isArray(parsed)) this.cart = parsed;
      }
    } catch (err) {
      console.warn('No se pudo leer el carrito desde localStorage', err);
    }
  }
}
