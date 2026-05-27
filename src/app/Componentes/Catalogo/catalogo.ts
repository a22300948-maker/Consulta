import { Component, inject, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from "@angular/core";
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
export class CatalogoComponent implements OnInit, OnDestroy, AfterViewInit {
  private productoService = inject(ProductoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products: Products[] = [];
  displayedProducts: Products[] = [];
  searchQuery = '';
  selectedCategory = '';
  categories: string[] = [];
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
        this.categories = [...new Set(this.products.map(p => p.category))].sort();
        this.applySearch();
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando productos desde API:', err);
        this.products = [];
        this.displayedProducts = [];
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  ngAfterViewInit(): void {
    try {
      const input = document.getElementById('catalog-search-input') as HTMLInputElement | null;
      if (input) {
        input.value = this.searchQuery || '';
      }
    } catch (e) {
    }
    this.cdr.detectChanges();
  }

  goToCart(): void {
    this.router.navigate(['/carrito']);
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applySearch();
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
    const cat = (this.selectedCategory || '').trim();

    this.displayedProducts = this.products.filter(p => {
      const name = p.name?.toLowerCase() || '';
      const category = p.category?.toLowerCase() || '';

      const matchesSearch = !q || q === 'null' || q === 'undefined' || name.includes(q) || category.includes(q);
      const matchesCategory = !cat || category === cat.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }
}
