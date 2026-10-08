import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminstudentlistComponent } from '../adminstudentlist/adminstudentlist.component';
import { AdminstudentviewComponent } from '../adminstudentview/adminstudentview.component';
import { AdminprofileComponent } from '../adminprofile/adminprofile.component';
import { StudentviewComponent } from '../studentview/studentview.component';

@Component({
  selector:'app-logout',
  standalone:true,
  imports:[CommonModule, AdminstudentlistComponent, AdminstudentviewComponent, AdminprofileComponent, StudentviewComponent],
  templateUrl:'./logout.component.html',
  styleUrl:'./logout.component.scss'
})
export class LogoutComponent {
  readonly returnUrl = this.getReturnUrl();
  readonly isAdmin = this.returnUrl === '/adminprofile' || this.returnUrl.startsWith('/adminstudent');
  readonly isAdminStudentList = this.returnUrl === '/adminstudentlist';
  readonly isAdminStudentDetail = this.returnUrl.startsWith('/adminstudentview/');
  readonly isAdminProfile = this.returnUrl === '/adminprofile';
  readonly isStudentView = this.returnUrl === '/studentview';
  readonly studentId = this.isAdminStudentDetail
    ? this.returnUrl.slice('/adminstudentview/'.length)
    : null;

  constructor(private router:Router){}

  cancel():void{
    this.router.navigateByUrl(this.returnUrl);
  }

  confirm():void{
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }

  private getReturnUrl(): string {
    const candidate: unknown = history.state?.returnUrl;
    if (
      typeof candidate === 'string'
      && (candidate === '/studentview'
        || candidate === '/adminstudentlist'
        || candidate === '/adminprofile'
        || /^\/adminstudentview\/[^/]+$/.test(candidate))
    ) {
      return candidate;
    }

    return localStorage.getItem('userRole') === 'admin'
      ? '/adminstudentlist'
      : '/studentview';
  }
}