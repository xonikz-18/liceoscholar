import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../services/auth.service';

interface StudentNavItem {
  label: string;
  path: string;
  icon: string;
}

/** Sidebar and layout shared by every student page. */
@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './student-shell.component.html',
  styleUrl: './student-shell.component.scss'
})
export class StudentShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly studentName = (this.auth.user()?.fullName ?? 'Student Profile').trim() || 'Student Profile';

  readonly navItems: StudentNavItem[] = [
    { label: 'Dashboard', path: '/studentview/dashboard', icon: 'dashboard' },
    {
      label: 'Requirement Submission',
      path: '/studentview/requirements',
      icon: 'upload'
    },
    { label: 'Student Profile', path: '/studentview/profile', icon: 'user' }
  ];

  logout(): void {
    this.router.navigate([{ outlets: { modal: ['logout'] } }], {
      state: { returnUrl: '/studentview/dashboard' }
    });
  }
}