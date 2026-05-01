import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductoService } from './services/producto.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Consulta');

  private productoService = inject(ProductoService);

  toastMessage = '';
  toastVisible = false;

  constructor() {
    // Mostrar una notificación cuando se añade algo al carrito
    this.productoService.cartAdd$.subscribe(({ product, quantity }) => {
      this.showToast(`${quantity} × ${product.name} añadido`);
    });
    // Mensajes generales del carrito (eliminar/vaciar)
    this.productoService.cartNotify$.subscribe((msg) => this.showToast(msg));
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2400);
  }
}
