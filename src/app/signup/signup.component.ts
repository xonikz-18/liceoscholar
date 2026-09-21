import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  fullName = '';
  signupEmail = '';
  signupPassword = '';
  confirmPassword = '';
  switching = false;

  constructor(private router: Router) {}

  goToLogin(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/login']), 220);
  }

  signup(): void {
    if (!this.fullName || !this.signupEmail || !this.signupPassword || !this.confirmPassword) {
      alert('Please complete all fields.');
      return;
    }

    if (this.signupPassword !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    localStorage.setItem('registeredEmail', this.signupEmail);
    alert('Account created successfully!');
    this.router.navigate(['/login']);
  }
}