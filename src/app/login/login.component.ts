import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginEmail = '';
  loginPassword = '';
  switching = false;

  constructor(private router: Router) {}

  goToSignup(): void {
    this.switching = true;
    setTimeout(() => this.router.navigate(['/signup']), 220);
  }

  login(): void {
    if (!this.loginEmail || !this.loginPassword) {
      alert('Please enter your school email and password.');
      return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', this.loginEmail);

    this.router.navigate(['/studentview']);
  }

  forgotPassword(): void {
    alert('Password recovery will be connected later.');
  }
}