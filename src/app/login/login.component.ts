import { ChangeDetectorRef, Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  showPassword = false;
  switching = false;
  readonly animateForm = history.state?.fadeAuthForm === true;

  constructor(private router: Router, private changeDetector: ChangeDetectorRef) {}

  goToSignup(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/signup'], { state: { fadeAuthForm: true } }), 360);
  }

  clearLoginError(): void {
    this.loginError = '';
  }

  async login(): Promise<void> {
    const attemptedEmail = this.loginEmail;
    const attemptedPassword = this.loginPassword;

    if (!attemptedEmail || !attemptedPassword) {
      this.loginError = 'Please enter your school email or admin username and password.';
      return;
    }

    this.loginError = '';

    if (attemptedEmail.trim().toLowerCase() === 'authorizedadminscholar') {
      try {
        const response = await fetch('/admin-demo-auth.json', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Admin demo credentials could not be loaded (${response.status}).`);
        }

        const config: unknown = await response.json();
        if (
          typeof config !== 'object'
          || config === null
          || !('username' in config)
          || !('password' in config)
          || typeof config.username !== 'string'
          || typeof config.password !== 'string'
        ) {
          throw new Error('Admin demo credentials have an invalid format.');
        }

        if (
          attemptedEmail.trim() !== config.username
          || attemptedPassword !== config.password
        ) {
          if (this.loginEmail === attemptedEmail && this.loginPassword === attemptedPassword) {
            this.showLoginError('Invalid username or password.');
          }
          return;
        }

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', config.username);
        localStorage.setItem('userRole', 'admin');
        await this.router.navigate(['/adminstudentlist']);
        return;
      } catch (error) {
        console.error('Admin demo login failed.', error);
        if (this.loginEmail === attemptedEmail && this.loginPassword === attemptedPassword) {
          this.showLoginError('Unable to verify the demo admin account. Check the local admin demo configuration.');
        }
        return;
      }
    }

    const registeredEmail = localStorage.getItem('registeredEmail');
    const registeredPassword = localStorage.getItem('registeredPassword');
    if (
      attemptedEmail.trim().toLowerCase() !== registeredEmail?.toLowerCase()
      || attemptedPassword !== registeredPassword
    ) {
      if (this.loginEmail === attemptedEmail && this.loginPassword === attemptedPassword) {
        this.loginError = 'Invalid username or password.';
      }
      return;
    }

    if (localStorage.getItem('registeredEmailVerified') !== 'true') {
      if (this.loginEmail === attemptedEmail && this.loginPassword === attemptedPassword) {
        this.loginError = 'Please confirm your email before logging in.';
      }
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', attemptedEmail.trim());
    localStorage.setItem('userRole', 'student');

    this.router.navigate(['/studentview']);
  }

  private showLoginError(message: string): void {
    this.loginError = message;
    this.changeDetector.markForCheck();
  }

  forgotPassword(): void {
    alert('Password recovery will be connected later.');
  }
}