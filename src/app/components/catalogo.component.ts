import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from "@angular/core";
import { ProductoCardComponent } from "./producto-card/producto-card.component";
import { ProductoService } from "../services/producto.service";
import { PaypalService } from "../services/paypal.service";
import { firstValueFrom } from 'rxjs';
import { Products } from "../models/producto.model";
import { RouterOutlet, Router } from "@angular/router";
import { Observable } from 'rxjs';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [AsyncPipe, ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent implements OnInit {

    private productoService = inject(ProductoService);
    private router = inject(Router);
    private paypalService = inject(PaypalService);

    products$: Observable<Products[]> = this.productoService.getAllFromApi();
    counter = 0;

    ngOnInit(): void {
        this.loadPaypalSdk();
    }

    private async loadPaypalSdk() {
        try {
            const data = await firstValueFrom(this.paypalService.getClientId());
            const clientId = (data as any)?.clientId ?? (data as any)?.clientID ?? (data as any)?.clientid;
            if (!clientId) {
                console.warn('PayPal client id missing in response');
                return;
            }
            const scriptId = 'paypal-sdk-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN&components=buttons`;
                script.async = true;
                document.body.appendChild(script);
            }
        } catch (err) {
            console.error('Error loading PayPal SDK', err);
        }
    }

    goToCart() {
        this.router.navigate(['/carrito']);
    }
    addToCart(product: Products) {
        this.productoService.addToCart(product);
        this.counter++;
    }
}