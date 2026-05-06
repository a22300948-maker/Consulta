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
  private modalPendingQty = '';

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
    setTimeout(() => (this.toastVisible = false), 2000);
  }

  closeProductModal() {
    this.modalService.close();
  }

  // Modal quantity helpers
  getProductQty(productId: number) {
    return this.productoService.getCart().filter(p => p.id === productId).length;
  }

  increaseProduct(product: Products) {
    this.productoService.addToCart(product, 1);
  }

  decreaseProduct(product: Products) {
    const qty = this.getProductQty(product.id);
    if (qty <= 1) {
      const should = confirm(`Eliminar la última unidad de ${product.name}?`);
      if (!should) return;
    }
    this.productoService.removeOne(product.id);
  }

  onModalQtyInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const cleaned = (el.value || '').replace(/\D+/g, '');
    el.value = cleaned;
    this.modalPendingQty = cleaned;
  }

  onModalQtyCommit(product: Products) {
    const q = this.modalPendingQty === '' ? this.getProductQty(product.id) : (parseInt(this.modalPendingQty, 10) || 0);
    const newQty = Math.max(0, q);
    if (newQty === 0) {
      const should = confirm(`Eliminar ${product.name} del carrito por completo?`);
      if (!should) {
        this.modalPendingQty = '';
        return;
      }
    }
    this.productoService.setProductQuantity(product, newQty);
    this.modalPendingQty = '';
  }
}
