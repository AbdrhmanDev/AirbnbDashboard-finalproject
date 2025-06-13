import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { HotelsService } from '../../../services/hotels.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category';
import { AdvantagesFormComponent } from './advantages-form/advantages-form.component';
import { CloudinaryUploaderComponent } from '../../cloudinary-uploader/cloudinary-uploader.component';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-create-hotel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    AdvantagesFormComponent,
    CloudinaryUploaderComponent,
  ],
  templateUrl: './create-hotel.component.html',
  styleUrls: ['./create-hotel.component.css'],
})
export class CreateHotelComponent implements OnInit, AfterViewInit {
  @ViewChild('map') mapContainer!: ElementRef;
  private map!: L.Map;
  private marker!: L.Marker;
  private defaultLat = 30.0444; // Default latitude (Cairo)
  private defaultLng = 31.2357; // Default longitude (Cairo)
  private defaultIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  hotelForm!: FormGroup;
  imageFiles: File[] = [];
  base64Images: string[] = [];
  previewUrls: string[] = [];
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private hotelsService: HotelsService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        console.log(this.categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  private initForm(): void {
    this.hotelForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
        ],
      ],
      pricePerNight: [
        0,
        [Validators.required, Validators.min(1), Validators.max(10000)],
      ],
      aboutThisSpace: [
        '',
        [Validators.minLength(10), Validators.maxLength(1000)],
      ],

      // Address
      address: this.fb.group({
        fullAddress: ['', [Validators.minLength(5), Validators.maxLength(200)]],
        country: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        city: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        coordinates: this.fb.array([
          this.fb.control(null), // Longitude
          this.fb.control(null), // Latitude
        ]),
      }),

      images: this.fb.array([], Validators.required),

      // Space Details
      spaceDetails: this.fb.group({
        bedrooms: [
          1,
          [Validators.required, Validators.min(1), Validators.max(5)],
        ],
        path: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
        beds: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
        area: [10, [Validators.required, Validators.min(10)]],
        rooms: [
          1,
          [Validators.required, Validators.min(1), Validators.max(10)],
        ],
      }),

      // Capacity
      capacity: this.fb.group({
        adults: [
          1,
          [Validators.required, Validators.min(1), Validators.max(10)],
        ],
        children: [
          0,
          [Validators.required, Validators.min(0), Validators.max(5)],
        ],
        infants: [
          0,
          [Validators.required, Validators.min(0), Validators.max(3)],
        ],
      }),

      petPolicy: ['not_allowed', Validators.required],
      view: ['none', Validators.required],
      advantages: this.fb.array([], Validators.required),
      cancellationPolicy: ['flexible', Validators.required],
      propertyType: ['apartment', Validators.required],

      safetyFeatures: this.fb.group({
        smokeDetector: [false],
        carbonMonoxideDetector: [false],
        firstAidKit: [false],
        fireExtinguisher: [false],
      }),

      houseRules: this.fb.array([]),

      status: ['available', Validators.required],
      categoryId: ['', Validators.required],
      rating: [0, [Validators.min(0), Validators.max(5)]],
    });
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          this.imageFiles.push(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const base64String = e.target.result as string;
              this.base64Images.push(base64String);
              this.previewUrls.push(base64String);
              this.hotelForm.patchValue({
                images: this.base64Images,
              });
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number): void {
    this.imageFiles.splice(index, 1);
    this.base64Images.splice(index, 1);
    this.previewUrls.splice(index, 1);
    this.hotelForm.patchValue({
      images: this.base64Images,
    });
  }
  onImageUpload(imageUrl: string) {
    this.images.push(this.fb.control(imageUrl)); // إضافة الصورة للـ FormArray
  }
  get images(): FormArray {
    return this.hotelForm.get('images') as FormArray;
  }

  onSubmit(): void {
    if (true) {
      // this.hotelForm.valid && this.base64Images.length > 0
      const formValue = this.hotelForm.value;

      // Create the final form data object

      this.hotelsService.createHotel(formValue).subscribe({
        next: (response) => {
          this.snackBar.open('Hotel created successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['/hotels']);
        },
        error: (error) => {
          this.snackBar.open(
            'Failed to create hotel. Please try again.',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
          console.error('Error creating hotel:', error);
          console.log(this.hotelForm.value);
        },
      });
    } else {
      this.markFormGroupTouched(this.hotelForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.hotelForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      return `Value must be greater than ${control.errors?.['min'].min}`;
    }
    return '';
  }
  get advantagesFormArray(): FormArray {
    return this.hotelForm.get('advantages') as FormArray;
  }
  getFormControl(controlName: string): FormControl {
    return this.hotelForm.get(controlName) as FormControl;
  }
  setInitialValues(): void {
    this.hotelForm.patchValue({
      status: 'available',
    });
  }

  private initMap() {
    // Initialize the map
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.defaultLat, this.defaultLng],
      13
    );

    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // Add click event to the map
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Update marker position
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(
          this.map
        );
      }

      // Update form values
      const coordinates = this.hotelForm.get(
        'address.coordinates'
      ) as FormArray;
      coordinates.setValue([lng, lat]);
    });
  }
}
