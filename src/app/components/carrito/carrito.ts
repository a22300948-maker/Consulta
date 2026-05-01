import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Products } from '../../models/producto.model';
import { PaypalService } from '../../services/paypal.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface PaypalButtonOrderData {
  orderID: string;
}

interface PaypalButtonActions {
  order: {
    create: () => Promise<string>;
    capture: () => Promise<unknown>;
  };
}

interface PaypalButtonsConfig {
  createOrder: () => Promise<string>;
  onApprove: (data: PaypalButtonOrderData, actions: PaypalButtonActions) => void | Promise<void>;
  onError: (error: unknown) => void;
}

interface PaypalSdk {
  Buttons: (config: PaypalButtonsConfig) => { render: (selector: string) => Promise<void> };
}

declare global {
  interface Window {
    paypal?: PaypalSdk;
  }
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  private productoService = inject(ProductoService);
  private carritoService = inject(CarritoService);
  private paypalService = inject(PaypalService);
  private readonly paypalScriptId = 'paypal-sdk-script';
  private cdr = inject(ChangeDetectorRef);

  cartItems: { product: Products; quantity: number; subtotal: number }[] = [];
  paymentError = '';
  paymentSuccess = '';
  paypalReady = false;
  overlayOpen = false;

  constructor() {
    this.loadCart();
    void this.initPaypal();
  }

  loadCart() {
    this.cartItems = this.productoService.getCartSummary();

    if (this.paypalReady) {
      this.renderPaypalButtons();
    }
  }

  get total(): number {
    return this.cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get iva(): number {
    return this.total * 0.16; // 16% de IVA
  }

  removeItem(productId: number) {
    // Mantener por compatibilidad: eliminar una unidad
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
    // allow Angular to render the modal into the DOM before attempting to render buttons
    this.cdr.detectChanges();
    setTimeout(() => {
      if (!this.paypalReady) {
        void this.initPaypal();
      } else {
        void this.renderPaypalButtons();
      }
    }, 0);
  }

  closeOverlay() {
    this.overlayOpen = false;
    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';
  }

  private async initPaypal() {
    if (this.cartItems.length === 0 || this.paypalReady) {
      return;
    }

    this.paymentError = '';

    try {
      await this.loadPaypalSdk();
      this.paypalReady = true;
      this.renderPaypalButtons();
    } catch {
      this.paymentError = 'No se pudo cargar PayPal. Verifica tu client ID y vuelve a intentar.';
    }
  }

  private async loadPaypalSdk() {
    if (window.paypal) {
      return;
    }

    const existingScript = document.getElementById(this.paypalScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      await this.waitForScript(existingScript);
      return;
    }

    // Try to obtain client-id from backend; fallback to environment
    let clientId = environment.paypalClientID;
    try {
      const res = await firstValueFrom(this.paypalService.getClientId());
      if (res?.clientId) {
        clientId = res.clientId;
      }
    } catch (err) {
      console.warn('No se pudo obtener client id desde backend, usando environment:', err);
    }

    const script = document.createElement('script');
    script.id = this.paypalScriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${environment.currency}`;
    script.async = true;
    document.body.appendChild(script);

    await this.waitForScript(script);
  }

  private waitForScript(script: HTMLScriptElement) {
    return new Promise<void>((resolve, reject) => {
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de PayPal')), {
        once: true,
      });
    });
  }

  private async renderPaypalButtons() {
    if (!window.paypal || this.cartItems.length === 0) {
      return;
    }

    // wait for the container to be present in the DOM (modal may take a tick)
    let container = document.getElementById('paypal-button-container');
    let tries = 0;
    while (!container && tries < 6) {
      // wait 50ms and retry
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      await new Promise((r) => setTimeout(r, 50));
      container = document.getElementById('paypal-button-container');
      tries++;
    }

    if (!container) {
      console.warn('paypal container not found for rendering buttons');
      return;
    }

    container.innerHTML = '';
    this.paymentError = '';

    try {
      await window.paypal.Buttons({
        createOrder: async () => {
          const payload = {
            items: this.cartItems.map((item) => ({
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            total: this.total,
          };

          const order = await firstValueFrom(this.paypalService.crearOrden(payload));
          if (!order?.id) {
            throw new Error('No se recibio el ID de la orden');
          }

          return order.id;
        },
        onApprove: async (data) => {
          await firstValueFrom(this.paypalService.capturarOrden(data.orderID));
          this.carritoService.generateXML(this.productoService.getCart());
          this.productoService.clearCart();
          this.paymentSuccess = 'Pago aprobado. Se descargo tu recibo en XML.';
          this.loadCart();
          this.closeOverlay();
        },
        onError: () => {
          this.paymentError = 'Ocurrio un error al procesar el pago con PayPal.';
        },
      }).render('#paypal-button-container');
    } catch (err) {
      console.error('Error rendering PayPal Buttons:', err);
      this.paymentError = 'No se pudo mostrar el boton de PayPal.';
    }
  }
}