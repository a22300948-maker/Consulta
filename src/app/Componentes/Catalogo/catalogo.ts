import { Component, inject, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from '@angular/common';
import { ProductoCardComponent } from '../ProductoCard/producto-card';
import { ProductoService } from "../../Servicios/producto.service";
import { Products } from "../../Modelos/producto.model";
import { RouterOutlet, Router } from "@angular/router";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, ProductoCardComponent, RouterOutlet],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent implements OnInit, OnDestroy {
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

    this.productoService.getAllFromApi().subscribe({
      next: list => {
        this.products = list || [];
        this.displayedProducts = [...this.products];
      },
      error: err => {
        console.error('Error cargando productos desde API:', err);
        this.products = [];
        this.displayedProducts = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  goToCart(): void {
    this.router.navigate(['/carrito']);
  }

  // capture only when Enter is pressed
  onSearchInput(ev: Event) {
    if (!(ev.target instanceof HTMLInputElement)) return;
    const v = ev.target.value || '';
    this.searchQuery = v.trim();
    // Apply search only on Enter key
    if ((ev as KeyboardEvent).type === 'keydown' && (ev as KeyboardEvent).key !== 'Enter') return;
    this.applySearch();
  }

  applySearch(): void {
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) {
      this.displayedProducts = [...this.products];
      return;
    }
    this.displayedProducts = this.products.filter(p =>
      (p.name?.toLowerCase() === q) || (p.category?.toLowerCase() === q)
    );
  }
}
