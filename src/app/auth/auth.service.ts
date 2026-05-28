import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
    providedIn: 'root'
})

export
class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    constructor(private http: HttpClient) { }

    login(username: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { username, password });
    }
    register(username: string, email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, { username, email, password });
    }

    requestPasswordReset(identifier: string): Observable<{ message?: string; debugCode?: string }> {
        return this.http.post<{ message?: string; debugCode?: string }>(`${this.apiUrl}/forgot-password`, { identifier });
    }

    resetPassword(identifier: string, code: string, newPassword: string): Observable<{ message?: string }> {
        return this.http.post<{ message?: string }>(`${this.apiUrl}/reset-password`, { identifier, code, newPassword });
    }
    saveToken(token: string): void {
        localStorage.setItem('token', token);
    }
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getTokenPayload<T extends object = any>(): T | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const b64Url = parts[1];
            const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
            const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
            const json = atob(padded);
            return JSON.parse(json) as T;
        } catch {
            return null;
        }
    }

    isAdmin(): boolean {
        const payload = this.getTokenPayload<any>();
        return payload?.isAdmin === true || payload?.isAdmin === 1;
    }
    logout(): void {
        localStorage.removeItem('token');
    }
    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}
