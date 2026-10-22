import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Confirmation dialog shown before signing out.
 *
 * The dialog is rendered on top of the real page: the router keeps the current
 * component in place, so whatever the user was looking at stays exactly as it
 * was behind the dimmed overlay — same data, same scroll position, and no
 * repeated API calls.
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
  private readonly location = inject(Location);

  /** True once the user confirms; the dialog stays up until the router moves on. */
  signingOut = false;

  cancel(): void {
    this.location.back();
  }

  confirm(): void {
    this.signingOut = true;

    // Drop the dialog before navigating: the destination is usually guarded and
    // redirects, which would otherwise leave this overlay on the login screen.
    void this.router
      .navigate([{ outlets: { modal: null } }], { skipLocationChange: true })
      .then(() => {
        this.auth.logout();
        return this.router.navigate(['/login']);
      });
  }
}
