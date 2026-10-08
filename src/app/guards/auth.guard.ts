import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return localStorage.getItem('isLoggedIn') === 'true'
    && localStorage.getItem('userRole') === 'student'
    ? true
    : router.createUrlTree(['/login']);
};