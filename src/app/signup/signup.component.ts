import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PendingSignup {
  fullName: string;
  email: string;
  age: number;
  course: string;
  yearLevel: string;
  scholarshipType: string;
  password: string;
}

type SignupDropdown = 'yearLevel' | 'course' | 'scholarshipType';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  fullName = '';
  signupEmail = '';
  age = '';
  course = '';
  yearLevel = '';
  scholarshipType = '';
  activeSignupDropdown: SignupDropdown | null = null;
  signupPassword = '';
  confirmPassword = '';
  confirmationPending = false;
  signupError = '';
  passwordRequirementsError = false;
  switching = false;
  readonly animateForm = history.state?.fadeAuthForm === true;
  readonly courseOptions = ['BSIT', 'SBMA', 'COE', 'CON', 'COM', 'CAS', 'CRS', 'CCJ', 'COP', 'CMLS', 'COD', 'COL', 'COA'];
  readonly yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  readonly scholarshipOptions = [
    'Full Academic Scholarship',
    'Half Academic Scholarship',
    'Non-Academic Scholarship'
  ];

  constructor(private router: Router) {}

  get passwordHasNumber(): boolean {
    return /\d/.test(this.signupPassword);
  }

  get passwordHasUppercase(): boolean {
    return /[A-Z]/.test(this.signupPassword);
  }

  goToLogin(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/login'], { state: { fadeAuthForm: true } }), 360);
  }

  toggleSignupDropdown(dropdown: SignupDropdown): void {
    this.activeSignupDropdown = this.activeSignupDropdown === dropdown ? null : dropdown;
  }

  chooseSignupOption(dropdown: SignupDropdown, value: string): void {
    if (dropdown === 'yearLevel') {
      this.yearLevel = value;
    } else if (dropdown === 'course') {
      this.course = value;
    } else {
      this.scholarshipType = value;
    }

    this.activeSignupDropdown = null;
  }

  signup(): void {
    this.signupError = '';
    this.passwordRequirementsError = false;

    if (this.confirmationPending) {
      return;
    }

    if (
      !this.fullName.trim()
      || !this.signupEmail.trim()
      || !this.age
      || !this.course
      || !this.yearLevel
      || !this.scholarshipType
      || !this.signupPassword
      || !this.confirmPassword
    ) {
      this.signupError = 'Please complete all fields.';
      return;
    }

    const age = Number(this.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      this.signupError = 'Enter a valid age between 1 and 120.';
      return;
    }

    if (!this.passwordHasNumber || !this.passwordHasUppercase) {
      this.passwordRequirementsError = true;
      return;
    }

    if (this.signupPassword !== this.confirmPassword) {
      this.signupError = 'Passwords do not match.';
      return;
    }

    const pendingSignup: PendingSignup = {
      fullName: this.fullName.trim(),
      email: this.signupEmail.trim().toLowerCase(),
      age,
      course: this.course,
      yearLevel: this.yearLevel,
      scholarshipType: this.scholarshipType,
      password: this.signupPassword
    };

    try {
      localStorage.setItem('pendingSignup', JSON.stringify(pendingSignup));
      this.confirmationPending = true;
    } catch (error) {
      console.error('Unable to save the pending signup.', error);
      this.signupError = 'Unable to start signup. Please try again.';
    }
  }

  confirmEmail(): void {
    this.signupError = '';

    try {
      const rawPendingSignup = localStorage.getItem('pendingSignup');
      if (!rawPendingSignup) {
        this.signupError = 'No pending signup was found. Please sign up again.';
        this.confirmationPending = false;
        return;
      }

      const pendingSignup: unknown = JSON.parse(rawPendingSignup);
      if (!this.isPendingSignup(pendingSignup)) {
        throw new Error('The pending signup has an invalid format.');
      }

      localStorage.setItem('registeredEmail', pendingSignup.email);
      localStorage.setItem('registeredPassword', pendingSignup.password);
      localStorage.setItem('registeredEmailVerified', 'true');
      localStorage.setItem('registeredFullName', pendingSignup.fullName);
      localStorage.setItem('registeredAge', String(pendingSignup.age));
      localStorage.setItem('registeredCourse', pendingSignup.course);
      localStorage.setItem('registeredYearLevel', pendingSignup.yearLevel);
      localStorage.setItem('registeredScholarshipType', pendingSignup.scholarshipType);
      localStorage.setItem('userEmail', pendingSignup.email);
      localStorage.setItem('userRole', 'student');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.removeItem('pendingSignup');

      this.router.navigate(['/studentview']);
    } catch (error) {
      console.error('Unable to confirm the demo email address.', error);
      this.signupError = 'Unable to confirm this signup. Please try again.';
    }
  }

  private isPendingSignup(value: unknown): value is PendingSignup {
    return typeof value === 'object'
      && value !== null
      && 'fullName' in value
      && typeof value.fullName === 'string'
      && 'email' in value
      && typeof value.email === 'string'
      && 'age' in value
      && typeof value.age === 'number'
      && 'course' in value
      && typeof value.course === 'string'
      && 'yearLevel' in value
      && typeof value.yearLevel === 'string'
      && 'scholarshipType' in value
      && typeof value.scholarshipType === 'string'
      && 'password' in value
      && typeof value.password === 'string';
  }
}