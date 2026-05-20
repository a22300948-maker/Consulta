import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponentTs } from './register.component.ts';

describe('RegisterComponentTs', () => {
  let component: RegisterComponentTs;
  let fixture: ComponentFixture<RegisterComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponentTs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
