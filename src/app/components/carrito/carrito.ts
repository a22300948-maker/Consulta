import { Component } from '@angular/core';
import { ProductoService } from '../../services/producto.service';
import { Products } from '../../models/producto.model';

@Component({
  selector: 'app-carrito',
  standalone: true,
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {

  products: Products[] = [];

  constructor(private productoService: ProductoService){
    this.products = this.productoService.getCart();
  }
  generateXML(){

let xml = `<cart>\n`;

this.products.forEach(p => {
xml += `
    <product>
        <id>${p.id}</id>
        <name>${p.name}</name>
        <price>${p.price}</price>
        <category>${p.category}</category>
    </product>`;
});

xml += `\n</cart>`;


/* crear archivo */
const blob = new Blob([xml], { type: 'application/xml' });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = 'carrito.xml';

    a.click();

    window.URL.revokeObjectURL(url);

    }

}