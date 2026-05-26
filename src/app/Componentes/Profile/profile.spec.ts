import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../Servicios/user.service';

import { ProfileComponent } from './profile';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => true,
            logout: () => undefined,
          },
        },
        {
          provide: UserService,
          useValue: {
            getProfile: () => of({
              id: 1,
              username: 'test',
              email: 'test@example.com',
              createdAt: new Date().toISOString(),
            }),
            getOrderHistory: () => of([]),
            updateProfile: () => of({
              id: 1,
              username: 'test',
              email: 'test@example.com',
              createdAt: new Date().toISOString(),
            }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
