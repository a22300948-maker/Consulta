import { Component, inject, OnInit } from '@angular/core';
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

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.authService.register(this.username.trim(), this.email.trim(), this.password).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = (error as any)?.error?.message || 'No se pudo crear la cuenta.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
