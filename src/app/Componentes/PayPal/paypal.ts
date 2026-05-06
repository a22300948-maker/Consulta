import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { PaypalService } from '../../Servicios/paypal.service';
import { Products } from '../../Modelos/producto.model';
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

@Component({
  selector: 'app-paypal',
  standalone: true,
  templateUrl: './paypal.html',
  styleUrl: './paypal.css'
})
export class PaypalComponent {
  @Input() cartItems: { product: Products; quantity: number; subtotal: number }[] = [];
  @Output() approved = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private paypalService = inject(PaypalService);
  private readonly paypalScriptId = 'paypal-sdk-script';
  private cdr = inject(ChangeDetectorRef);

  paypalReady = false;
  paymentError = '';
  paymentSuccess = '';

  constructor() {}

  ngOnInit(): void {
    void this.initPaypal();
  }

  async initPaypal() {
    if (this.cartItems.length === 0 || this.paypalReady) {
      return;
    }

    this.paymentError = '';

    try {
      await this.loadPaypalSdk();
      this.paypalReady = true;
      await this.renderPaypalButtons();
    } catch (err) {
      console.warn('initPaypal error', err);
      this.paymentError = 'No se pudo cargar PayPal. Verifica tu client ID y vuelve a intentar.';
      this.error.emit(this.paymentError);
    }
  }

  private async loadPaypalSdk() {
    if ((window as any).paypal) {
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
    if (!(window as any).paypal || this.cartItems.length === 0) {
      return;
    }

    // wait for the container to be present in the DOM
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
      await (window as any).paypal.Buttons({
        createOrder: async () => {
          const payload = {
            items: this.cartItems.map((item) => ({
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            total: this.cartItems.reduce((acc, i) => acc + i.subtotal, 0),
          };

          const order = await firstValueFrom(this.paypalService.crearOrden(payload));
          if (!order?.id) {
            throw new Error('No se recibio el ID de la orden');
          }

          return order.id;
        },
        onApprove: async (data: PaypalButtonOrderData) => {
          await firstValueFrom(this.paypalService.capturarOrden(data.orderID));
          this.paymentSuccess = 'Pago aprobado.';
          this.approved.emit();
        },
        onError: (err: unknown) => {
          console.error('PayPal error', err);
          this.paymentError = 'Ocurrio un error al procesar el pago con PayPal.';
          this.error.emit(this.paymentError);
        },
      }).render('#paypal-button-container');
    } catch (err) {
      console.error('Error rendering PayPal Buttons:', err);
      this.paymentError = 'No se pudo mostrar el boton de PayPal.';
      this.error.emit(this.paymentError);
    }
  }

  onClose() {
    this.close.emit();
  }
}
