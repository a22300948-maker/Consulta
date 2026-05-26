import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../Servicios/user.service';
import { UserOrder, UserProfile } from '../../Modelos/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  profileForm = {
    email: '',
    fullName: '',
    address: '',
    postalCode: '',
  };
  orders: UserOrder[] = [];
  loading = false;
  saving = false;
  message = '';
  errorMessage = '';

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/registro']);
      return;
    }

    this.loadProfile();
    this.loadOrders();
  }

  loadProfile(): void {
    this.loading = true;

    this.userService.getProfile().pipe(
      timeout(10000),
      catchError((error: unknown) => {
        this.profile = null;
        this.errorMessage = (error as any)?.error?.message || 'No se pudo cargar el perfil.';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe((profile) => {
      if (!profile) return;
      this.profile = profile;
      this.profileForm = {
        email: profile.email,
        fullName: profile.fullName ?? '',
        address: profile.address ?? '',
        postalCode: profile.postalCode ?? '',
      };
      this.errorMessage = '';
      this.cdr.detectChanges();
    });
  }

  loadOrders(): void {
    this.userService.getOrderHistory().subscribe({
      next: (result) => {
        const maybeAny = result as any;
        const orders = Array.isArray(result)
          ? result
          : Array.isArray(maybeAny?.orders)
            ? maybeAny.orders
            : [];
        this.orders = orders;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Error cargando pedidos:', error);
        this.orders = [];
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile(): void {
    if (!this.profile) {
      return;
    }

    this.saving = true;
    this.message = '';
    this.errorMessage = '';

    const payload = {
      fullName: this.profileForm.fullName,
      email: this.profileForm.email,
      address: this.profileForm.address,
      postalCode: this.profileForm.postalCode,
    };

    this.userService.updateProfile(payload).pipe(
      timeout(10000),
      catchError((error: unknown) => {
        this.errorMessage = (error as any)?.error?.message || 'No se pudo actualizar el perfil.';
        return of(null);
      }),
      finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      })
    ).subscribe((updated) => {
      if (!updated) return;
      this.profile = updated;
      this.profileForm = {
        email: updated.email,
        fullName: updated.fullName ?? '',
        address: updated.address ?? '',
        postalCode: updated.postalCode ?? '',
      };
      this.message = 'Perfil actualizado correctamente.';
      this.cdr.detectChanges();
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
