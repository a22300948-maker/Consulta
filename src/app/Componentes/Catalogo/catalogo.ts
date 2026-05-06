import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from "@angular/core";
import { ProductoCardComponent } from "../ProductoCard/producto-card";
import { ProductoService } from '../../Servicios/producto.service';
import { Products } from '../../Modelos/producto.model';
import { RouterOutlet, Router } from "@angular/router";
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [AsyncPipe, ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.html',
    styleUrls: ['./catalogo.css']
})
export class CatalogoComponent {

    private productoService = inject(ProductoService);
    private router = inject(Router);

    products$: Observable<Products[]> = this.productoService.getAllFromApi();
    counter = 0;
    private subs: Subscription[] = [];

    ngOnInit(): void {
        this.counter = this.productoService.getCart().length;
        this.subs.push(this.productoService.cartChanged$.subscribe(() => {
            this.counter = this.productoService.getCart().length;
        }));
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    goToCart() {
        this.router.navigate(['/carrito']);
    }
    // product-card ahora actualiza el carrito directamente; el contador se actualiza mediante cartChanged$
}
