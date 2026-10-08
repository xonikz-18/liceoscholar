import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { StudentviewComponent } from './studentview/studentview.component';
import { LogoutComponent } from './logout/logout.component';
import { AdminstudentlistComponent } from './adminstudentlist/adminstudentlist.component';
import { AdminstudentviewComponent } from './adminstudentview/adminstudentview.component';
import { AdminprofileComponent } from './adminprofile/adminprofile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'studentview', component: StudentviewComponent, canActivate: [authGuard] },
  { path: 'adminstudentlist', component: AdminstudentlistComponent },
  { path: 'adminstudentview/:studentId', component: AdminstudentviewComponent },
  { path: 'adminprofile', component: AdminprofileComponent },
  { path: 'logout', component: LogoutComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];