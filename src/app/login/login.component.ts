import { ChangeDetectorRef, Component, OnDestroy, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { describeHttpError, isEmailUnconfirmedError } from '../services/api.config';
import { isSchoolEmail, SCHOOL_EMAIL_MESSAGE } from '../services/school-email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  loginEmail = '';
  loginPassword = '';
  loginError = '';
  needsConfirmation = false;
  resendMessage = '';
  showPassword = false;
  switching = false;
  readonly animateForm = history.state?.fadeAuthForm === true;

  // --- Forgot password ------------------------------------------------
  showResetModal = false;
  resetStep: 'email' | 'code' = 'email';
  resetEmail = '';
  resetCode = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  resetError = '';
  resetSubmitting = false;
  /** Seconds until the emailed code stops working. */
  resetSecondsLeft = 0;
  /** Seconds until another code may be requested. */
  resendSecondsLeft = 0;

  // --- Toast ----------------------------------------------------------
  toastMessage = '';
  toastVisible = false;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  get resetPasswordValid(): boolean {
    return (
      this.resetNewPassword.length >= 8
      && /[A-Z]/.test(this.resetNewPassword)
      && /\d/.test(this.resetNewPassword)
    );
  }

  get resetExpired(): boolean {
    return this.resetStep === 'code' && this.resetSecondsLeft <= 0;
  }

  get resetExpiryLabel(): string {
    const total = Math.max(this.resetSecondsLeft, 0);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  goToSignup(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/signup'], { state: { fadeAuthForm: true } }), 360);
  }

  clearLoginError(): void {
    this.loginError = '';
    this.needsConfirmation = false;
    this.resendMessage = '';
  }

  /** Signs in through the API; students land on the portal, admins on the list. */
  async login(): Promise<void> {
    const attemptedEmail = this.loginEmail;
    const attemptedPassword = this.loginPassword;

    if (!attemptedEmail || !attemptedPassword) {
      this.loginError = 'Please enter your school email or admin username and password.';
      return;
    }

    const attemptedIdentifier = attemptedEmail.trim().toLowerCase();
    // Admins sign in with a plain username, so only an address has to pass the
    // school-domain check.
    if (attemptedIdentifier.includes('@') && !isSchoolEmail(attemptedIdentifier)) {
      this.loginError = SCHOOL_EMAIL_MESSAGE;
      return;
    }

    this.loginError = '';

    try {
      const user = await this.auth.login(attemptedEmail.trim(), attemptedPassword);
      await this.router.navigate([user.role === 'admin' ? '/adminstudentlist' : '/studentview']);
    } catch (error) {
      if (this.loginEmail === attemptedEmail && this.loginPassword === attemptedPassword) {
        this.needsConfirmation = isEmailUnconfirmedError(error);
        this.showLoginError(describeHttpError(error));
      }
    }
  }

  /**
   * Re-sends the verification email for an account that signed up but has not
   * confirmed its address yet, so nobody gets stuck on the login form.
   */
  async resendVerification(): Promise<void> {
    const email = this.loginEmail.trim().toLowerCase();
    if (!email) {
      return;
    }

    this.loginError = '';
    this.resendMessage = '';

    try {
      await this.auth.resendVerification(email);
      this.needsConfirmation = false;
      this.resendMessage = 'Verification email sent. Please check your inbox (and spam folder).';
      this.changeDetector.markForCheck();
    } catch (error) {
      this.showLoginError(describeHttpError(error));
    }
  }

  // --- Forgot password --------------------------------------------------

  /** Opens the reset dialog, prefilling the email if it is a school address. */
  openForgotPassword(): void {
    const typed = this.loginEmail.trim().toLowerCase();
    this.resetStep = 'email';
    this.resetEmail = isSchoolEmail(typed) ? typed : '';
    this.resetCode = '';
    this.resetNewPassword = '';
    this.resetConfirmPassword = '';
    this.resetError = '';
    this.resetSubmitting = false;
    this.resetSecondsLeft = 0;
    this.resendSecondsLeft = 0;
    this.showResetModal = true;
    this.changeDetector.markForCheck();
  }

  closeForgotPassword(): void {
    this.showResetModal = false;
    this.resetSubmitting = false;
    this.stopCountdown();
    this.changeDetector.markForCheck();
  }

  /** Emails the 4-digit reset code. */
  async sendResetCode(): Promise<void> {
    const email = this.resetEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.resetError = 'Enter a valid school email.';
      return;
    }
    if (!isSchoolEmail(email)) {
      this.resetError = SCHOOL_EMAIL_MESSAGE;
      return;
    }

    this.resetError = '';
    this.resetSubmitting = true;

    try {
      const request = await this.auth.forgotPassword(email);
      this.resetEmail = email;
      this.startCountdown(request.expiresInSeconds, request.resendAfterSeconds);
      this.resetStep = 'code';
      this.showToast(
        `We emailed a 4-digit code to ${email}. It expires in ${Math.round(request.expiresInSeconds / 60)} minutes.`
      );
    } catch (error) {
      this.resetError = describeHttpError(error);
    } finally {
      this.resetSubmitting = false;
      this.changeDetector.markForCheck();
    }
  }

  /** Requests a fresh code (allowed once the 1-minute cooldown has elapsed). */
  async resendResetCode(): Promise<void> {
    if (this.resendSecondsLeft > 0 || this.resetSubmitting) {
      return;
    }

    this.resetError = '';
    this.resetSubmitting = true;

    try {
      const request = await this.auth.forgotPassword(this.resetEmail.trim().toLowerCase());
      this.startCountdown(request.expiresInSeconds, request.resendAfterSeconds);
      this.resetCode = '';
      this.showToast(`A new code is on its way to ${this.resetEmail}.`);
    } catch (error) {
      this.resetError = describeHttpError(error);
    } finally {
      this.resetSubmitting = false;
      this.changeDetector.markForCheck();
    }
  }

  /** Applies the new password using the emailed code. */
  async submitResetPassword(): Promise<void> {
    const email = this.resetEmail.trim().toLowerCase();
    const code = this.resetCode.trim();

    if (!/^\d{4}$/.test(code)) {
      this.resetError = 'Enter the 4-digit code from your email.';
      return;
    }
    if (!this.resetPasswordValid) {
      this.resetError =
        'Password must be at least 8 characters and include one number and one uppercase letter.';
      return;
    }
    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.resetError = 'Passwords do not match.';
      return;
    }

    this.resetError = '';
    this.resetSubmitting = true;

    try {
      await this.auth.resetPassword(email, code, this.resetNewPassword);
      this.showResetModal = false;
      this.stopCountdown();
      this.loginEmail = email;
      this.loginPassword = '';
      this.clearLoginError();
      this.showToast('Password updated. You can now log in with your new password.');
    } catch (error) {
      this.resetError = describeHttpError(error);
    } finally {
      this.resetSubmitting = false;
      this.changeDetector.markForCheck();
    }
  }

  private startCountdown(expiresInSeconds: number, resendAfterSeconds: number): void {
    this.stopCountdown();
    this.resetSecondsLeft = expiresInSeconds;
    this.resendSecondsLeft = resendAfterSeconds;

    this.countdownTimer = setInterval(() => {
      if (this.resetSecondsLeft > 0) {
        this.resetSecondsLeft -= 1;
      }
      if (this.resendSecondsLeft > 0) {
        this.resendSecondsLeft -= 1;
      }
      if (this.resetSecondsLeft <= 0 && this.resendSecondsLeft <= 0) {
        this.stopCountdown();
      }
      this.changeDetector.markForCheck();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.changeDetector.markForCheck();
    }, 5000);

    this.changeDetector.markForCheck();
  }

  private showLoginError(message: string): void {
    this.loginError = message;
    this.changeDetector.markForCheck();
  }
}
