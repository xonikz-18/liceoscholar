import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { describeHttpError } from '../services/api.config';

/**
 * Landing page for the link inside a verification email
 * (/verify-email?token=...). Confirms the account, signs the student in and
 * sends them to their scholar profile.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  status: 'checking' | 'success' | 'error' = 'checking';
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!token) {
      this.status = 'error';
      this.errorMessage =
        'This verification link is missing its token. Please open the link from your email again.';
      return;
    }

    try {
      await this.auth.verifyEmailToken(token);
      this.status = 'success';
      this.changeDetector.markForCheck();
      await this.router.navigate(['/studentview']);
    } catch (error) {
      this.status = 'error';
      this.errorMessage = describeHttpError(error);
      this.changeDetector.markForCheck();
    }
  }
}
