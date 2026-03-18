import { Injectable } from '@angular/core';
import { Products } from '../../models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {

  generateXML(products: Products[]): void {
    let xml = `<cart>`;

    products.forEach(p => {
      xml += `
    <product>
        <id>${p.id}</id>
        <name>${p.name}</name>
        <price>${p.price}</price>
        <category>${p.category}</category>
    </product>`;
    });

    xml += `\n</cart>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'carrito.xml';
    a.click();

    window.URL.revokeObjectURL(url);
  }
}
