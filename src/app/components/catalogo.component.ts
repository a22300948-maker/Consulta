import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from "@angular/core";
import { ProductoCardComponent } from "./producto-card/producto-card.component";
import { ProductoService } from "../services/producto.service";
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

    products$: Observable<Products[]> = this.productoService.getAllFromApi();
    counter = 0;

    ngOnInit(): void {
        this.loadPaypalSdk();
    }

    private async loadPaypalSdk() {
        try {
            const res = await fetch('/api/paypal/client-id');
            if (!res.ok) {
                console.warn('PayPal client id not available from backend');
                return;
            }
            const data = await res.json();
            const clientId = data?.clientId ?? data?.clientID ?? data?.clientid;
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