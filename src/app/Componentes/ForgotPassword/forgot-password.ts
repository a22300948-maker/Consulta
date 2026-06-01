import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPasswordComponent implements OnInit {
  identifier = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  step: 1 | 2 = 1;
  loading = false;
  errorMessage = '';
  successMessage = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.isAdmin() ? '/admin' : '/catalogo']);
    }
  }

  requestCode(): void {
    this.zone.run(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.markForCheck();
    });

    const identifier = this.identifier.trim();
    if (!identifier) {
      this.zone.run(() => {
        this.errorMessage = 'Por favor ingresa tu correo o nombre de usuario.';
        this.cdr.markForCheck();
      });
      return;
    }

    this.zone.run(() => {
      this.loading = true;
      this.cdr.markForCheck();
    });
    this.authService.requestPasswordReset(identifier).subscribe({
      next: (resp) => {
        this.zone.run(() => {
          this.successMessage = resp?.message || 'Si existe una cuenta, se envió un código de recuperación al correo.';
          this.step = 2;
          this.cdr.markForCheck();
        });
      },
      error: (error: unknown) => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage = (error as any)?.error?.message || 'No se pudo enviar el código.';
          this.cdr.markForCheck();
        });
      },
      complete: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  submitNewPassword(): void {
    this.zone.run(() => {
      this.errorMessage = '';
      this.successMessage = '';
      this.cdr.markForCheck();
    });

    const identifier = this.identifier.trim();
    const code = this.code.trim();

    if (!identifier || !code || !this.newPassword) {
      this.zone.run(() => {
        this.errorMessage = 'Por favor completa todos los campos.';
        this.cdr.markForCheck();
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9]{6}$/.test(code)) {
      this.zone.run(() => {
        this.errorMessage = 'El código debe tener 6 caracteres alfanuméricos.';
        this.cdr.markForCheck();
      });
      return;
    }

    if (this.newPassword.length < 6) {
      this.zone.run(() => {
        this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        this.cdr.markForCheck();
      });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.zone.run(() => {
        this.errorMessage = 'Las contraseñas no coinciden.';
        this.cdr.markForCheck();
      });
      return;
    }

    this.zone.run(() => {
      this.loading = true;
      this.cdr.markForCheck();
    });
    this.authService.resetPassword(identifier, code, this.newPassword).subscribe({
      next: (resp) => {
        this.zone.run(() => {
          this.successMessage = resp?.message || 'Contraseña actualizada.';
          this.code = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.cdr.markForCheck();
        });
      },
      error: (error: unknown) => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage = (error as any)?.error?.message || 'No se pudo actualizar la contraseña.';
          this.cdr.markForCheck();
        });
      },
      complete: () => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }
}
