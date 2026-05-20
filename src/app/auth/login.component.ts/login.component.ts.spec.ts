import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponentTs } from './login.component.ts';

describe('LoginComponentTs', () => {
  let component: LoginComponentTs;
  let fixture: ComponentFixture<LoginComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponentTs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
