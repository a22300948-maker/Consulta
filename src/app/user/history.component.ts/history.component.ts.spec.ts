import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryComponentTs } from './history.component.ts';

describe('HistoryComponentTs', () => {
  let component: HistoryComponentTs;
  let fixture: ComponentFixture<HistoryComponentTs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponentTs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryComponentTs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
