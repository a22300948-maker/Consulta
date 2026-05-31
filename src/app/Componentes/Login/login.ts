import { Component, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;
  hasError = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.hasError = false;
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Por favor ingresa tu usuario y contraseña.';
      this.hasError = true;
      return;
    }

    this.loading = true;
    this.authService.login(this.username.trim(), this.password).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: (response: { token?: string }) => {
        if (response?.token) {
          this.hasError = false;
          this.authService.saveToken(response.token);
          this.router.navigate(['/']);
        } else {
          this.hasError = true;
          this.errorMessage = 'Respuesta inesperada del servidor.';
        }
      },
      error: (error: unknown) => {
        this.hasError = true;
        const e = error as any;
        this.errorMessage = e?.error?.message || e?.error?.error || e?.message || 'Error en el inicio de sesión.';
      }
    });
  }

  clearError(): void {
    this.errorMessage = '';
    this.hasError = false;
  }
}
