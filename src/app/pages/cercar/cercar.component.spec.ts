import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CercarComponent } from './cercar.component';

describe('CercarComponent', () => {
  let component: CercarComponent;
  let fixture: ComponentFixture<CercarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CercarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CercarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
