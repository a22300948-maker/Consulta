import { Component, inject, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../Servicios/producto.service';
import { CarritoService } from '../../Servicios/carrito.service';
import { Products } from '../../Modelos/producto.model';
import { firstValueFrom } from 'rxjs';
import { PaypalComponent } from '../PayPal/paypal';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, PaypalComponent],
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
  private pendingQuantities = new Map<number, string>();
  // Elements used to keep the totals column fixed while scrolling
  private totalsEl: HTMLElement | null = null;
  private totalsPlaceholder: HTMLElement | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor() {
    this.loadCart();
    // actualizar vista cuando el servicio notifique cambios en el carrito
    this.productoService.cartChanged$.subscribe(() => this.loadCart());
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
    const stock = typeof product.inStock === 'number' ? product.inStock : 0;
    if (stock <= 0) {
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

  onDecreaseClick(item: { product: Products; quantity: number; subtotal: number }) {
    // si queda sólo 1 unidad, pedir confirmación antes de eliminarla
    if (item.quantity <= 1) {
      const should = confirm(`Eliminar la última unidad de ${item.product.name}?`);
      if (!should) return;
      const removed = this.productoService.removeOne(item.product.id);
      if (removed) this.loadCart();
      return;
    }

    // comportamiento por defecto: disminuir una unidad
    this.decreaseOne(item.product);
  }

  onQtyInput(item: { product: Products; quantity: number; subtotal: number }, ev: Event) {
    const el = ev.target as HTMLInputElement;
    // permitir solo dígitos
    const cleaned = (el.value || '').replace(/\D+/g, '');
    el.value = cleaned;
    this.pendingQuantities.set(item.product.id, cleaned);
    item.quantity = cleaned === '' ? 0 : parseInt(cleaned, 10);
    item.subtotal = item.product.price * item.quantity;
  }

  onQtyCommit(item: { product: Products; quantity: number; subtotal: number }) {
    const raw = this.pendingQuantities.get(item.product.id);
    const newQty = raw === undefined ? item.quantity : (parseInt(raw, 10) || 0);
    this.productoService.setProductQuantity(item.product, Math.max(0, newQty));
    this.pendingQuantities.delete(item.product.id);
    this.loadCart();
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

  ngAfterViewInit(): void {
    // initialize totals element and attach scroll/resize listeners
    try {
      this.totalsEl = document.querySelector('.right-col .totals') as HTMLElement | null;
      const cartLayout = document.querySelector('.cart-layout') as HTMLElement | null;
      if (!this.totalsEl || !cartLayout) return;

      // placeholder keeps layout space when totals become fixed
      this.totalsPlaceholder = document.createElement('div');
      this.totalsPlaceholder.className = 'totals-placeholder';
      this.totalsPlaceholder.style.height = '0px';
      this.totalsEl.parentElement?.appendChild(this.totalsPlaceholder);

      this.scrollHandler = () => this.updateTotalsPosition();
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
      // initial check
      this.updateTotalsPosition();
    } catch (e) {
      // defensive: don't break the app if DOM isn't as expected
      console.warn('Carrito: could not initialize sticky totals', e);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  private updateTotalsPosition() {
    if (!this.totalsEl || !this.totalsPlaceholder) return;

    const rightCol = document.querySelector('.right-col') as HTMLElement | null;
    const cartLayout = document.querySelector('.cart-layout') as HTMLElement | null;
    if (!rightCol || !cartLayout) return;

    const rightRect = rightCol.getBoundingClientRect();
    const layoutRect = cartLayout.getBoundingClientRect();
    const totalsRect = this.totalsEl.getBoundingClientRect();

    const viewportTop = 20;
    const minWidthForFixed = 720; // disable on small screens

    // If viewport is narrow, avoid fixed behavior
    if (window.innerWidth < minWidthForFixed) {
      if (this.totalsEl.classList.contains('fixed')) {
        this.totalsEl.classList.remove('fixed');
        this.totalsEl.style.position = '';
        this.totalsEl.style.left = '';
        this.totalsEl.style.top = '';
        this.totalsEl.style.width = '';
        this.totalsEl.style.zIndex = '';
        this.totalsPlaceholder.style.height = '0px';
      }
      return;
    }

    // decide when to fix: when the top of the layout is above viewport top
    // and there remains enough space below to show totals
    const shouldFix = layoutRect.top < viewportTop && layoutRect.bottom > totalsRect.height + viewportTop + 16;

    if (shouldFix) {
      if (!this.totalsEl.classList.contains('fixed')) {
        this.totalsEl.classList.add('fixed');
        this.totalsPlaceholder.style.height = `${this.totalsEl.offsetHeight}px`;
      }
      // compute left and width so fixed element sits exactly where the right column was
      const left = Math.max(16, rightRect.left);
      const width = Math.max(220, rightRect.width);
      this.totalsEl.style.position = 'fixed';
      this.totalsEl.style.left = `${left}px`;
      this.totalsEl.style.top = `${viewportTop}px`;
      this.totalsEl.style.width = `${width}px`;
      this.totalsEl.style.zIndex = '999';
    } else {
      if (this.totalsEl.classList.contains('fixed')) {
        this.totalsEl.classList.remove('fixed');
        this.totalsEl.style.position = '';
        this.totalsEl.style.left = '';
        this.totalsEl.style.top = '';
        this.totalsEl.style.width = '';
        this.totalsEl.style.zIndex = '';
        this.totalsPlaceholder.style.height = '0px';
      }
    }
  }

  onPaypalError(msg?: string) {
    this.paymentError = msg || 'Ocurrió un error al procesar el pago con PayPal.';
  }
}
