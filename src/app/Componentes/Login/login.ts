import { Component, inject, OnInit } from '@angular/core';
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

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  submit(): void {
    this.errorMessage = '';
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Por favor ingresa tu usuario y contraseña.';
      return;
    }

    this.loading = true;
    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (response: { token?: string }) => {
        if (response?.token) {
          this.authService.saveToken(response.token);
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Respuesta inesperada del servidor.';
        }
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = (error as any)?.error?.message || 'Error en el inicio de sesión.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
