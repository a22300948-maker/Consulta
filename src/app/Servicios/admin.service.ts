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
  private adminBaseUrl = 'http://localhost:3000/api/admin/productos';

  getAllProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.baseUrl);
  }

  getAllAdminProducts(): Observable<Products[]> {
    return this.http.get<Products[]>(this.adminBaseUrl);
  }

  getProductById(productId: number): Observable<Products> {
    return this.http.get<Products>(`${this.baseUrl}/${productId}`);
  }

  createProduct(payload: Partial<Products>): Observable<Products> {
    return this.http.post<Products>(this.baseUrl, payload);
  }

  updateProduct(productId: number, payload: Partial<Products>): Observable<Products> {
    return this.http.put<Products>(`${this.baseUrl}/${productId}`, payload);
  }

  deleteProduct(productId: number): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${this.baseUrl}/${productId}`);
  }

  setProductActive(productId: number, isActive: boolean): Observable<Products> {
    return this.http.put<Products>(`${this.baseUrl}/${productId}/active`, { isActive: isActive ? 1 : 0 });
  }

  updateProductStock(productId: number, inStock: number): Observable<Products> {
    const payload: AdminStockUpdateRequest = { inStock };
    return this.http.put<Products>(`${this.baseUrl}/${productId}/stock`, payload);
  }
}
