import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductoService } from './Servicios/producto.service';
import { ModalService } from './Servicios/modal.service';
import { Products } from './Modelos/producto.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Consulta');

  private productoService = inject(ProductoService);
  private modalService = inject(ModalService);

  selectedProduct: Products | null = null;
  modalVisible = false;

  toastMessage = '';
  toastVisible = false;

  constructor() {
    // Mensajes generales del carrito (eliminar/vaciar)
    this.productoService.cartNotify$.subscribe((msg) => this.showToast(msg));
    // Modal product details
    this.modalService.modal$.subscribe((p) => {
      this.selectedProduct = p;
      this.modalVisible = !!p;
    });
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2400);
  }

  closeProductModal() {
    this.modalService.close();
  }
}
