import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvantagesFormComponent } from './advantages-form.component';

describe('AdvantagesFormComponent', () => {
  let component: AdvantagesFormComponent;
  let fixture: ComponentFixture<AdvantagesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvantagesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvantagesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
