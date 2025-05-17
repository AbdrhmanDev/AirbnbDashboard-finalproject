import { Component, OnInit } from '@angular/core';
import { Hotel2 } from '../../../models/hoteln';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HotelsService } from '../../../services/hotels.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { GalleriaModule } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteConfirmationComponent } from '../delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-hotel-detials',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    CardModule,
    GalleriaModule,
    ButtonModule,
    TagModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CarouselModule,
    MatDialogModule,
  ],
  templateUrl: './hotel-detials.component.html',
  styleUrls: ['./hotel-detials.component.css'],
})
export class HotelDetialsComponent implements OnInit {
  hotel!: Hotel2;
  errorMessage!: string;
  isLoading = true;
  carouselOptions: OwlOptions = {
    loop: true,
    margin: 10,
    nav: true,
    dots: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    responsive: {
      0: { items: 1 },
      600: { items: 2 },
      1000: { items: 3 },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private hotelsService: HotelsService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.hotelsService.getHotelById(id).subscribe({
        next: (hotel) => {
          this.hotel = hotel;
          this.isLoading = false;
          console.log('Hotel loaded:', hotel);
        },
        error: (err) => {
          this.errorMessage = 'Failed to load hotel details.';
          this.isLoading = false;
          this.snackBar.open('Failed to load hotel details', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  onDelete(id: string): void {
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      width: '400px',
      data: { hotelName: this.hotel.title },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.hotelsService.deleteHotel(id).subscribe({
          next: () => {
            this.snackBar.open('Hotel deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'],
            });
            this.router.navigate(['/hotels']);
          },
          error: (err) => {
            console.error('Failed to delete hotel:', err);
            this.snackBar.open('Failed to delete hotel', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar'],
            });
          },
        });
      }
    });
  }

  onEdit(): void {
    if (this.hotel) {
      this.router.navigate(['/hotels/edit', this.hotel._id]);
    }
  }

  getFirstImageUrl(images: string[]): string {
    return images && images.length > 0 ? images[0] : 'assets/placeholder.jpg';
  }

  getSafetyFeatures(): string[] {
    const features: string[] = [];
    if (this.hotel.safetyFeatures) {
      if (this.hotel.safetyFeatures.smokeDetector)
        features.push('Smoke Detector');
      if (this.hotel.safetyFeatures.carbonMonoxideDetector)
        features.push('Carbon Monoxide Detector');
      if (this.hotel.safetyFeatures.firstAidKit) features.push('First Aid Kit');
      if (this.hotel.safetyFeatures.fireExtinguisher)
        features.push('Fire Extinguisher');
    }
    return features;
  }
}
