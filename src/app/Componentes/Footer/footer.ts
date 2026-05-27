import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly authService = inject(AuthService);

  get isAdminUser(): boolean {
    return this.authService.isAdmin();
  }
}
