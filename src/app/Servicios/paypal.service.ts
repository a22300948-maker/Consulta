import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface PaypalItem {
  name: string;
  quantity: number;
  price: number;
}

interface CreateOrderPayload {
  items: PaypalItem[];
  total: number;
}

interface CreateOrderResponse {
  id: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaypalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/paypal`;

  crearOrden(payload: CreateOrderPayload) {
    return this.http.post<CreateOrderResponse>(`${this.apiUrl}/create-order`, payload);
  }

  capturarOrden(orderID: string) {
    return this.http.post(`${this.apiUrl}/capture-order`, { orderId: orderID });
  }

  getClientId() {
    return this.http.get<{ clientId: string }>(`${this.apiUrl}/client-id`);
  }
}
