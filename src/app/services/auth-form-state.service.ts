import { Injectable } from '@angular/core';

/**
 * Keeps the login and registration form values alive while the user
 * switches between the Log In and Sign Up pages.  Because Angular
 * destroys the component when you navigate away, storing the values
 * here (a singleton service) makes them survive the route change.
 */
@Injectable({ providedIn: 'root' })
export class AuthFormStateService {
  // --- Login fields ---
  loginEmail = '';
  loginPassword = '';

  // --- Signup fields ---
  fullName = '';
  suffix = '';
  signupEmail = '';
  dateOfBirth = '';
  sex = '';
  course = '';
  yearLevel = '';
  scholarshipType = '';
  signupPassword = '';
  confirmPassword = '';
}
