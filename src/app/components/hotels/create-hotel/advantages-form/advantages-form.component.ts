import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-advantages-form',
  imports: [
      ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        CommonModule
  ],
  templateUrl: './advantages-form.component.html',
  styleUrl: './advantages-form.component.css'
})
export class AdvantagesFormComponent {
@Input() formArray!: FormArray;

  constructor(private fb: FormBuilder) {}

  addAdvantage() {
    this.formArray.push(this.fb.control(''));
  }

  removeAdvantage(index: number) {
    this.formArray.removeAt(index);
  }
    // هذه الدالة تعيد FormControl لكل عنصر
  getControl(index: number): FormControl {
    return this.formArray.at(index) as FormControl;
  }
}
