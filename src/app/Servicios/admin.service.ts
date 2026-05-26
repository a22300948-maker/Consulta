import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Products } from '../Modelos/producto.model';
import { AdminStockUpdateRequest } from '../Interfaces/admin.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api/productos';

  getAllProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.baseUrl);
  }

  updateProductStock(productId: number, inStock: number): Observable<Products> {
    const payload: AdminStockUpdateRequest = { inStock };
    return this.http.put<Products>(`${this.baseUrl}/${productId}/stock`, payload);
  }
}
