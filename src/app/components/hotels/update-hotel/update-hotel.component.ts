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
import { Router, ActivatedRoute } from '@angular/router';
import { HotelsService } from '../../../services/hotels.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category';
import { Hotel2 } from '../../../models/hoteln';
import { AdvantagesFormComponent } from '../create-hotel/advantages-form/advantages-form.component';
import { CloudinaryUploaderComponent } from '../../cloudinary-uploader/cloudinary-uploader.component';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LoginService } from '../../../services/login.service';

@Component({
  selector: 'app-update-hotel',
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
  templateUrl: './update-hotel.component.html',
  styleUrls: ['./update-hotel.component.css'],
})
export class UpdateHotelComponent implements OnInit, AfterViewInit {
  private defaultIcon = L.icon({
    iconUrl: 'assets/marker-icon.png',
    shadowUrl: 'assets/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  @ViewChild('map') mapContainer!: ElementRef;
  private map!: L.Map;
  private marker!: L.Marker;
  private defaultLat = 30.0444; // Default latitude (Cairo)
  private defaultLng = 31.2357; // Default longitude (Cairo)

  hotelForm!: FormGroup;
  hotelId!: string;
  categories: Category[] = [];
  isLoading = true;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private hotelsService: HotelsService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.loginService.getUserData();
    if (!this.currentUser || this.currentUser.role !== 'Host') {
      this.snackBar.open('Only hosts can edit hotels', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      this.router.navigate(['/hotels']);
      return;
    }

    this.hotelId = this.route.snapshot.params['id'];
    this.initForm();
    this.loadCategories();
    this.loadHotel();
  }

  ngAfterViewInit() {
    this.initMap();
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

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
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

  private loadHotel(): void {
    this.hotelsService.getHotelById(this.hotelId).subscribe({
      next: (hotel) => {
        this.populateForm(hotel);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hotel:', error);
        this.snackBar.open('Failed to load hotel details', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        this.router.navigate(['/hotels']);
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

  private populateForm(hotel: Hotel2): void {
    // Clear existing form arrays
    while (this.images.length) {
      this.images.removeAt(0);
    }
    while (this.advantages.length) {
      this.advantages.removeAt(0);
    }
    while (this.houseRules.length) {
      this.houseRules.removeAt(0);
    }

    // Add images
    hotel.images.forEach((image) => {
      this.images.push(this.fb.control(image));
    });

    // Add advantages
    hotel.advantages.forEach((advantage) => {
      this.advantages.push(this.fb.control(advantage));
    });

    // Add house rules if they exist
    if (hotel.houseRules) {
      hotel.houseRules.forEach((rule) => {
        this.houseRules.push(this.fb.control(rule));
      });
    }

    // Set coordinates if they exist
    if (hotel.address.coordinates) {
      const coordinates = this.hotelForm.get(
        'address.coordinates'
      ) as FormArray;
      coordinates.setValue(hotel.address.coordinates);
    }

    // Update the form with the hotel data
    this.hotelForm.patchValue({
      title: hotel.title,
      description: hotel.description,
      pricePerNight: hotel.pricePerNight,
      aboutThisSpace: hotel.aboutThisSpace,
      address: {
        fullAddress: hotel.address.fullAddress,
        country: hotel.address.country,
        city: hotel.address.city,
      },
      spaceDetails: hotel.spaceDetails,
      capacity: hotel.capacity,
      petPolicy: hotel.petPolicy,
      view: hotel.view,
      cancellationPolicy: hotel.cancellationPolicy,
      propertyType: hotel.propertyType,
      safetyFeatures: hotel.safetyFeatures,
      status: hotel.status,
      categoryId: hotel.categoryId,
      rating: hotel.rating,
    });

    // Update map marker if coordinates exist
    if (hotel.address.coordinates) {
      const [lng, lat] = hotel.address.coordinates;
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(
          this.map
        );
      }
      this.map.setView([lat, lng], 13);
    }
  }

  onImageUpload(imageUrl: string) {
    this.images.push(this.fb.control(imageUrl));
  }

  removeImage(index: number): void {
    this.images.removeAt(index);
  }

  get images(): FormArray {
    return this.hotelForm.get('images') as FormArray;
  }

  get advantages(): FormArray {
    return this.hotelForm.get('advantages') as FormArray;
  }

  get houseRules(): FormArray {
    return this.hotelForm.get('houseRules') as FormArray;
  }

  get advantagesFormArray(): FormArray {
    return this.hotelForm.get('advantages') as FormArray;
  }

  getFormControl(controlName: string): FormControl {
    return this.hotelForm.get(controlName) as FormControl;
  }

  onSubmit(): void {
    if (this.hotelForm.valid) {
      const formValue = this.hotelForm.value;
      this.hotelsService.updateHotel(this.hotelId, formValue).subscribe({
        next: () => {
          this.snackBar.open('Hotel updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['/hotels']);
        },
        error: (error) => {
          console.error('Error updating hotel:', error);
          this.snackBar.open('Failed to update hotel', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
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
}
