import { Component, inject, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from '@angular/common';
import { ProductoCardComponent } from "../ProductoCard/producto-card";
import { ProductoService } from '../../Servicios/producto.service';
import { Products } from '../../Modelos/producto.model';
import { RouterOutlet, Router } from "@angular/router";
import { Observable, Subscription } from 'rxjs';

@Component({
    selector: 'app-catalogo',
    standalone: true,
    imports: [CommonModule, ProductoCardComponent, RouterOutlet],
    templateUrl: './catalogo.html',
    styleUrls: ['./catalogo.css']
})
export class CatalogoComponent {

    private productoService = inject(ProductoService);
    private router = inject(Router);

    products: Products[] = [];
    displayedProducts: Products[] = [];
    searchQuery = '';
    counter = 0;
    private subs: Subscription[] = [];

    ngOnInit(): void {
        this.counter = this.productoService.getCart().length;
        this.subs.push(this.productoService.cartChanged$.subscribe(() => {
            this.counter = this.productoService.getCart().length;
        }));

        // cargar productos y mostrarlos
        this.productoService.getAllFromApi().subscribe({
            next: (list) => {
                this.products = list || [];
                this.displayedProducts = [...this.products];
            },
            error: (err) => {
                console.error('Error cargando productos desde API:', err);
                this.products = [];
                this.displayedProducts = [];
            }
        });
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    goToCart() {
        this.router.navigate(['/carrito']);
    }
    
    onSearchInput(ev: Event) {
        const v = (ev.target as HTMLInputElement).value || '';
        this.searchQuery = v.trim();
        this.applySearch();
    }

    applySearch() {
        const q = (this.searchQuery || '').trim().toLowerCase();
        if (!q) {
            this.displayedProducts = [...this.products];
            return;
        }
        // coincidencia exacta por nombre o categoría
        this.displayedProducts = this.products.filter(p =>
            (p.name || '').toLowerCase() === q || (p.category || '').toLowerCase() === q
        );
    }
    // product-card ahora actualiza el carrito directamente; el contador se actualiza mediante cartChanged$
}
