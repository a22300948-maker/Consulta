import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponentTs } from './profile.component.ts';

describe('ProfileComponentTs', () => {
  let component: ProfileComponentTs;
  let fixture: ComponentFixture<ProfileComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponentTs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
