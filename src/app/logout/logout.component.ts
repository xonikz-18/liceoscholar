import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StudentviewComponent } from '../studentview/studentview.component';

@Component({
  selector:'app-logout',
  standalone:true,
  imports:[StudentviewComponent],
  templateUrl:'./logout.component.html',
  styleUrl:'./logout.component.scss'
})
export class LogoutComponent {
  constructor(private router:Router){}

  cancel():void{
    this.router.navigate(['/studentview']);
  }

  confirm():void{
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    this.router.navigate(['/login']);
  }
}