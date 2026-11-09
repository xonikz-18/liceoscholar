import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { describeHttpError } from '../services/api.config';
import { isValidDateOfBirth, todayAsDateInput } from '../services/date';
import { isSchoolEmail, SCHOOL_EMAIL_MESSAGE } from '../services/school-email';

type SignupDropdown = 'yearLevel' | 'sex' | 'course' | 'scholarshipType';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  fullName = '';
  suffix = '';
  signupEmail = '';
  /** `YYYY-MM-DD` from the date picker. */
  dateOfBirth = '';
  sex = '';
  course = '';
  yearLevel = '';
  scholarshipType = '';
  activeSignupDropdown: SignupDropdown | null = null;
  signupPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  confirmationPending = false;
  signupError = '';
  resendMessage = '';
  passwordRequirementsError = false;

  fullNameError = '';
  emailError = '';
  dateOfBirthError = '';
  sexError = '';
  courseError = '';
  yearLevelError = '';
  scholarshipError = '';
  passwordError = '';
  confirmPasswordError = '';
  switching = false;
  /** Nothing after today can be a birth date. */
  readonly maxDateOfBirth = todayAsDateInput();
  readonly courseOptions = [
    'School of Business, Management, and Accountancy',
    'College of Nursing',
    'College of Law',
    'College of Arts and Science',
    'College of Information Technology',
    'College of Radiologic Technology',
    'Conservatory of Music, Theater, and Dance',
    'College of Engineering',
    'School of Teacher Education',
    'College of Rehabilitation Sciences',
    'College of Criminal Justice',
    'College of Pharmacy',
    'College of Medical Laboratory Science',
    'College of Dentistry',
    'College of Aviation'
  ];
  readonly yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  readonly sexOptions = ['Male', 'Female'];
  readonly scholarshipOptions = [
    'Full Academic Scholarship',
    'Half Academic Scholarship',
    'Special Scholarship'
  ];

  get passwordHasNumber(): boolean {
    return /\d/.test(this.signupPassword);
  }

  get passwordHasUppercase(): boolean {
    return /[A-Z]/.test(this.signupPassword);
  }

  get passwordHasMinLength(): boolean {
    return this.signupPassword.length >= 8;
  }

  goToLogin(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/login']), 360);
  }

  toggleSignupDropdown(dropdown: SignupDropdown): void {
    this.activeSignupDropdown = this.activeSignupDropdown === dropdown ? null : dropdown;
  }

  chooseSignupOption(dropdown: SignupDropdown, value: string): void {
    switch (dropdown) {
      case 'yearLevel':
        this.yearLevel = value;
        break;
      case 'sex':
        this.sex = value;
        break;
      case 'course':
        this.course = value;
        break;
      case 'scholarshipType':
        this.scholarshipType = value;
        break;
    }

    this.activeSignupDropdown = null;
  }

  /** Creates the account on the server and waits for email confirmation. */
  async signup(): Promise<void> {
    this.signupError = '';
    this.passwordRequirementsError = false;
    this.fullNameError = '';
    this.emailError = '';
    this.dateOfBirthError = '';
    this.sexError = '';
    this.courseError = '';
    this.yearLevelError = '';
    this.scholarshipError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    if (this.confirmationPending) {
      return;
    }

    let hasError = false;

    if (!this.fullName.trim()) {
      this.fullNameError = 'Please enter your full name.';
      hasError = true;
    }

    if (!this.signupEmail.trim()) {
      this.emailError = 'Please enter your school email.';
      hasError = true;
    } else if (!isSchoolEmail(this.signupEmail)) {
      this.emailError = SCHOOL_EMAIL_MESSAGE;
      hasError = true;
    }

    if (!this.dateOfBirth) {
      this.dateOfBirthError = 'Please choose your date of birth.';
      hasError = true;
    } else if (!isValidDateOfBirth(this.dateOfBirth)) {
      this.dateOfBirthError = 'Enter a valid date of birth.';
      hasError = true;
    }

    if (!this.sex) {
      this.sexError = 'Please choose your sex.';
      hasError = true;
    }

    if (!this.course) {
      this.courseError = 'Please choose a course.';
      hasError = true;
    }

    if (!this.yearLevel) {
      this.yearLevelError = 'Please choose a year level.';
      hasError = true;
    }

    if (!this.scholarshipType) {
      this.scholarshipError = 'Please choose a scholarship type.';
      hasError = true;
    }

    if (!this.signupPassword) {
      this.passwordError = 'Please enter a password.';
      hasError = true;
    } else if (!this.passwordHasMinLength || !this.passwordHasNumber || !this.passwordHasUppercase) {
      this.passwordError = 'Password must be at least 8 characters with a number and uppercase letter.';
      hasError = true;
    }

    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Please confirm your password.';
      hasError = true;
    } else if (this.signupPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match.';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      await this.auth.register({
        fullName: this.fullName.trim(),
        suffix: this.suffix.trim() || undefined,
        email: this.signupEmail.trim().toLowerCase(),
        dateOfBirth: this.dateOfBirth,
        sex: this.sex,
        course: this.course,
        yearLevel: this.yearLevel,
        scholarshipType: this.scholarshipType,
        password: this.signupPassword
      });

      this.confirmationPending = true;
    } catch (error) {
      const details = (error as { error?: { details?: { field?: string; message?: string }[] } })?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        for (const item of details) {
          const field = item?.field;
          const message = item?.message || 'Invalid value.';
          if (field === 'fullName') this.fullNameError = message;
          else if (field === 'email') this.emailError = message;
          else if (field === 'dateOfBirth') this.dateOfBirthError = message;
          else if (field === 'sex') this.sexError = message;
          else if (field === 'course') this.courseError = message;
          else if (field === 'yearLevel') this.yearLevelError = message;
          else if (field === 'scholarshipType') this.scholarshipError = message;
          else if (field === 'password') this.passwordError = message;
          else if (field === 'confirmPassword') this.confirmPasswordError = message;
          else this.signupError = message;
        }
      } else {
        this.signupError = describeHttpError(error);
      }
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  /** Re-sends the verification email for the account that is awaiting confirmation. */
  async resendVerification(): Promise<void> {
    this.signupError = '';
    this.resendMessage = '';

    try {
      await this.auth.resendVerification(this.signupEmail.trim().toLowerCase());
      this.resendMessage = 'Verification email sent. Please check your inbox (and spam folder).';
    } catch (error) {
      this.signupError = describeHttpError(error);
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  /** Forgets the pending signup and clears the form so another email can be used. */
  startNewSignup(): void {
    this.confirmationPending = false;
    this.signupError = '';
    this.resendMessage = '';
    this.passwordRequirementsError = false;
    this.fullNameError = '';
    this.emailError = '';
    this.dateOfBirthError = '';
    this.sexError = '';
    this.courseError = '';
    this.yearLevelError = '';
    this.scholarshipError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.activeSignupDropdown = null;
    this.fullName = '';
    this.suffix = '';
    this.signupEmail = '';
    this.dateOfBirth = '';
    this.sex = '';
    this.course = '';
    this.yearLevel = '';
    this.scholarshipType = '';
    this.signupPassword = '';
    this.confirmPassword = '';
    this.changeDetector.markForCheck();
  }
}
