import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Products } from '../../Modelos/producto.model';

export interface AdminProductModalResult {
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  sDescription: string;
  description: string;
  inStock: number;
}

@Component({
  selector: 'app-admin-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-product-modal.html',
  styleUrls: ['./admin-product-modal.css'],
})
export class AdminProductModalComponent implements OnChanges {
  @Input() open = false;
  @Input() product: Products | null = null;
  @Input() loading = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveProduct = new EventEmitter<AdminProductModalResult>();
  @Output() deleteProduct = new EventEmitter<void>();

  form = this.buildEmptyForm();
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] || changes['open']) {
      this.form = this.buildFormFromProduct(this.product);
      this.errorMessage = '';
    }
  }

  close(): void {
    this.closeModal.emit();
  }

  submit(): void {
    this.errorMessage = '';

    const name = this.form.name.trim();
    const category = this.form.category.trim();
    const imageUrl = this.form.imageUrl.trim();
    const sDescription = this.form.sDescription.trim();
    const description = this.form.description.trim();
    const price = Number(this.form.price);
    const inStock = Number(this.form.inStock);

    if (!name || !category || !imageUrl || !sDescription || !description) {
      this.errorMessage = 'Completa todos los campos del producto.';
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      this.errorMessage = 'El precio debe ser un número válido mayor o igual a 0.';
      return;
    }

    if (!Number.isInteger(inStock) || inStock < 0) {
      this.errorMessage = 'El stock debe ser un entero válido mayor o igual a 0.';
      return;
    }

    this.saveProduct.emit({
      name,
      price,
      imageUrl,
      category,
      sDescription,
      description,
      inStock,
    });
  }

  onDelete(): void {
    this.deleteProduct.emit();
  }

  private buildEmptyForm() {
    return {
      name: '',
      price: 0,
      imageUrl: '',
      category: '',
      sDescription: '',
      description: '',
      inStock: 0,
    };
  }

  private buildFormFromProduct(product: Products | null) {
    if (!product) return this.buildEmptyForm();
    return {
      name: product.name ?? '',
      price: product.price ?? 0,
      imageUrl: product.imageUrl ?? '',
      category: product.category ?? '',
      sDescription: product.sDescription ?? '',
      description: product.description ?? '',
      inStock: typeof product.inStock === 'number' ? product.inStock : 0,
    };
  }
}
