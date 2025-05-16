import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudinaryUploaderComponent } from './cloudinary-uploader.component';

describe('CloudinaryUploaderComponent', () => {
  let component: CloudinaryUploaderComponent;
  let fixture: ComponentFixture<CloudinaryUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloudinaryUploaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloudinaryUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
