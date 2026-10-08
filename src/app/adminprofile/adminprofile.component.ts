import { Component } from '@angular/core';
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
  constructor(private router: Router) {}

  openStudentList(): void {
    this.router.navigate(['/adminstudentlist']);
  }

  logout(): void {
    this.router.navigate(['/logout'], { state: { returnUrl: this.router.url } });
  }
}
