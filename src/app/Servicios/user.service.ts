import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UserOrder } from '../Modelos/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/user';

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(payload: Partial<Pick<UserProfile, 'fullName' | 'email' | 'address' | 'postalCode'>>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, payload);
  }

  getOrderHistory(): Observable<UserOrder[]> {
    return this.http.get<UserOrder[]>(`${this.apiUrl}/orders`);
  }
}
