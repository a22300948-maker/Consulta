import { Injectable } from '@angular/core';
import { Products } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private products: Products[] = [
    {
      id: 1,
      name: 'Laptop',
      price: 999.99,
      imageUrl: 'https://media.gq.com.mx/photos/67b4d7d66fe34e843830c6fb/master/w_1600,c_limit/MacBook_Pro_M4_Pro.jpg',
      category: 'Electronics',
      description: 'A high-performance laptop for all your computing needs.',
      inStock: true
    },
    {
      id: 2,
      name: 'Smartphone',
      price: 499.99,
      imageUrl: 'https://cdn5.coppel.com/mkp/74625348-1.jpg?iresize=width:564,height:451',
      category: 'Electronics',
      description: 'A sleek smartphone with the latest features.',
      inStock: true
    },
    {
      id: 3,
      name: 'Headphones',
      price: 199.99,
      imageUrl: 'https://m.media-amazon.com/images/I/81M31hLf2NL._AC_SY300_SX300_QL70_ML2_.jpg',
      category: 'Audio',
      description: 'Noise-cancelling headphones for an immersive audio experience.',
      inStock: false
    }
  ];

  // 🔴 carrito
  private cart: Products[] = [];

  getAll(): Products[] {
    return this.products;
  }

  // agregar al carrito
  addToCart(product: Products){
    this.cart.push(product);
  }

  // obtener carrito
  getCart(): Products[]{
    return this.cart;
  }

  // eliminar del carrito
  removeFromCart(id:number){
    this.cart = this.cart.filter(p => p.id !== id);
  }
}