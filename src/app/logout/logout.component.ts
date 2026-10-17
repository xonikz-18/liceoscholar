import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Confirmation shown before signing out.
 *
 * The page behind the dialog is a lightweight mock rather than the real page:
 * it is hidden behind a dark overlay, and re-rendering it would repeat every
 * API call for no visible benefit.
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = this.getReturnUrl();

  readonly navItems: string[] =
    this.auth.user()?.role === 'admin'
      ? ['Student List', 'Admin Profile', 'Log Out']
      : ['Dashboard', 'Requirement Submission', 'Student Profile', 'Log Out'];

  cancel(): void {
    this.router.navigateByUrl(this.returnUrl);
  }

  confirm(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Sends the user back to the page they came from. */
  private getReturnUrl(): string {
    const candidate: unknown = history.state?.returnUrl;
    if (typeof candidate === 'string' && candidate.startsWith('/')) {
      return candidate;
    }

    if (this.auth.user()?.role === 'admin') {
      return '/adminstudentlist';
    }

    return '/studentview/dashboard';
  }
}