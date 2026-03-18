import { Injectable } from '@angular/core';
import { Products } from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private products: Products[] = [
    {
      id: 1,
      name: 'Pan Artesanal Romano',
      price: 45.00,
      imageUrl: 'https://i.ytimg.com/vi/650ob30wQ50/maxresdefault.jpg',
      category: 'Alimentos',
      description: 'Pan rústico elaborado con técnicas inspiradas en la antigua Roma.',
      inStock: true
    },
    {
      id: 2,
      name: 'Queso de Cabra Artesanal',
      price: 120.00,
      imageUrl: 'https://tianguisvirtual.mx/wp-content/uploads/2022/09/13.png',
      category: 'Lácteos',
      description: 'Queso fresco de cabra con sabor tradicional romano.',
      inStock: true
    },
    {
      id: 3,
      name: 'Miel Natural',
      price: 80.00,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSj1sZzNjx30oxmqDOlmadCMBSXfKJp6xOiyQ&s',
      category: 'Endulzantes',
      description: 'Miel pura utilizada como principal endulzante en la época romana.',
      inStock: true
    },
    {
      id: 4,
      name: 'Aceitunas Mediterráneas',
      price: 65.00,
      imageUrl: 'https://http2.mlstatic.com/D_Q_NP_2X_879191-MLA99373462456_112025-T.webp',
      category: 'Alimentos',
      description: 'Aceitunas seleccionadas con estilo tradicional mediterráneo.',
      inStock: true
    },
    {
      id: 5,
      name: 'Vasija de Cerámica',
      price: 150.00,
      imageUrl: 'https://m.media-amazon.com/images/I/71LtaeN9EHL._AC_UF894,1000_QL80_.jpg',
      category: 'Utensilios',
      description: 'Recipiente de cerámica inspirado en utensilios romanos antiguos.',
      inStock: true
    },
    {
      id: 6,
      name: 'Túnica Romana',
      price: 250.00,
      imageUrl: 'https://i.etsystatic.com/55006896/r/il/3aaaf6/6400749494/il_340x270.6400749494_ttal.jpg',
      category: 'Recreación',
      description: 'Vestimenta tradicional romana ideal para eventos temáticos.',
      inStock: false
    },
    {
      id: 7,
      name: 'Vino Tinto Romano',
      price: 180.00,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv5pZ5xmwKscVbJvajqreksAdp-Lh32zpCtA&s',
      category: 'Bebidas',
      description: 'Vino tinto inspirado en las recetas tradicionales del Imperio Romano.',
      inStock: true
    },
    {
      id: 8,
      name: 'Pan de Higos',
      price: 55.00,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb8hOQNFZuS3RfiYPRUeXN-LSQraBQ9sjE8g&s',
      category: 'Alimentos',
      description: 'Pan dulce con higos, muy consumido en la antigua Roma.',
      inStock: true
    },
    {
      id: 9,
      name: 'Aceite de Oliva Extra Virgen',
      price: 140.00,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8Eqa4k4F3dEqFrFggT4hdYw56E2qgR41DQw&s',
      category: 'Alimentos',
      description: 'Aceite de oliva puro, esencial en la dieta romana.',
      inStock: true
    },
    {
      id: 10,
      name: 'Copa de Metal Antigua',
      price: 95.00,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5AflCjJmFHXvs38tnh4fKBtWWpAeYryf9Nw&s',
      category: 'Utensilios',
      description: 'Copa decorativa inspirada en banquetes romanos.',
      inStock: true
    },
    {
      id: 11,
      name: 'Casco de Gladiador',
      price: 320.00,
      imageUrl: 'https://m.media-amazon.com/images/I/61rEP1HfxhL.jpg',
      category: 'Recreación',
      description: 'Casco estilo gladiador para recreaciones históricas.',
      inStock: false
    },
    {
      id: 12,
      name: 'Sandalias Romanas',
      price: 210.00,
      imageUrl: 'https://m.media-amazon.com/images/I/518Qdrpt0dL._AC_UF894,1000_QL80_.jpg',
      category: 'Vestimenta',
      description: 'Calzado tradicional romano hecho con cuero.',
      inStock: true
    },
    {
      id: 13,
      name: 'Pergamino Decorativo',
      price: 70.00,
      imageUrl: 'https://img.freepik.com/vector-gratis/pergamino-abierto-realista-transparente_107791-19331.jpg?semt=ais_hybrid&w=740&q=80',
      category: 'Decoración',
      description: 'Pergamino estilo antiguo ideal para decoración temática.',
      inStock: true
    },
    {
      id: 14,
      name: 'Incienso Aromático',
      price: 60.00,
      imageUrl: 'https://naturalmarket.com.mx/wp-content/uploads/2021/06/Combo_Romano_Gris_03.jpg',
      category: 'Aromas',
      description: 'Incienso utilizado en rituales y templos romanos.',
      inStock: true
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