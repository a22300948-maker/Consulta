import { Component, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
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

    if (!this.username.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos.';
      this.hasError = true;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      this.hasError = true;
      return;
    }

    this.loading = true;
    this.authService.register(this.username.trim(), this.email.trim(), this.password).pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: () => {
        this.hasError = false;
        this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.hasError = true;
        const e = error as any;
        this.errorMessage = e?.error?.message || e?.error?.error || e?.message || 'No se pudo crear la cuenta.';
      }
    });
  }

  clearError(): void {
    this.errorMessage = '';
    this.hasError = false;
  }
}
