import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ProfilePhotoEditorComponent } from '../profile-photo-editor/profile-photo-editor.component';
import { AuthService } from '../services/auth.service';
import { formatDateOfBirth } from '../services/date';

@Component({
  selector: 'app-adminprofile',
  standalone: true,
  imports: [ProfilePhotoEditorComponent],
  templateUrl: './adminprofile.component.html',
  styleUrl: './adminprofile.component.scss'
})
export class AdminprofileComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly user = this.auth.user();

  /** Snapshot of the signed-in administrator, shown in the profile panel. */
  readonly admin = {
    name: this.user?.fullName || 'Administrator',
    suffix: this.user?.suffix || 'N/A',
    dateOfBirth: formatDateOfBirth(this.user?.dateOfBirth) || '—',
    sex: this.user?.sex || 'N/A'
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
