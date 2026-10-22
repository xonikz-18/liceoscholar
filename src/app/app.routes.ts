import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { StudentShellComponent } from './student-shell/student-shell.component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { StudentRequirementsComponent } from './student-requirements/student-requirements.component';
import { StudentProfileComponent } from './student-profile/student-profile.component';
import { LogoutComponent } from './logout/logout.component';
import { AdminstudentlistComponent } from './adminstudentlist/adminstudentlist.component';
import { AdminstudentviewComponent } from './adminstudentview/adminstudentview.component';
import { AdminprofileComponent } from './adminprofile/adminprofile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { homeGuard } from './guards/home.guard';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  {
    path: 'studentview',
    component: StudentShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'requirements', component: StudentRequirementsComponent },
      { path: 'profile', component: StudentProfileComponent }
    ]
  },
  { path: 'adminstudentlist', component: AdminstudentlistComponent, canActivate: [adminGuard] },
  {
    path: 'adminstudentview/:studentId',
    component: AdminstudentviewComponent,
    canActivate: [adminGuard]
  },
  { path: 'adminprofile', component: AdminprofileComponent, canActivate: [adminGuard] },
  {
    // Child of the current page, so the page itself stays rendered behind the
    // confirmation dialog instead of being replaced by an empty route.
    path: 'logout',
    component: LogoutComponent,
    outlet: 'modal'
  },
  // The bare site root keeps the session: signed-in accounts go straight to
  // their portal instead of always being sent to the login page on refresh.
  { path: '', pathMatch: 'full', component: HomeComponent, canActivate: [homeGuard] },
  { path: '**', redirectTo: '' }
];