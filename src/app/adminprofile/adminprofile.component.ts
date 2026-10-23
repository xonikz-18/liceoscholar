import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProfilePhotoEditorComponent } from '../profile-photo-editor/profile-photo-editor.component';

@Component({
  selector: 'app-adminprofile',
  standalone: true,
  imports: [ProfilePhotoEditorComponent],
  templateUrl: './adminprofile.component.html',
  styleUrl: './adminprofile.component.scss'
})
export class AdminprofileComponent {
  private readonly router = inject(Router);

  /** The office account that runs the scholarship portal. */
  readonly admin = {
    name: 'Liceo U Scholarship Office',
    email: 'admin@liceo.edu.ph'
  };

  openStudentList(): void {
    this.router.navigate(['/adminstudentlist']);
  }

  logout(): void {
    this.router.navigate([{ outlets: { modal: ['logout'] } }], {
      state: { returnUrl: this.router.url }
    });
  }
}
