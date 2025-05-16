import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-cloudinary-uploader',
  imports: [CommonModule],
  templateUrl: './cloudinary-uploader.component.html',
  styleUrl: './cloudinary-uploader.component.css',
})
export class CloudinaryUploaderComponent {
  @Output() imageUploaded = new EventEmitter<string>(); // Output event to send URL
  images: string[] = [];

  // Cloudinary Config
  private cloudName = 'dhttwlg0f';
  private uploadPreset = 'testtest';

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        this.uploadImage(file);
      });
    }
  }

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        this.images.push(data.secure_url); // Push URL to the list
        this.imageUploaded.emit(data.secure_url); // Emit the URL to the parent
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }
}
