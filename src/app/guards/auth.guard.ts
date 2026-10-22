import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Allows only signed-in students into the student portal. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // An administrator who opens a student link goes to their own portal.
  return user.role === 'student' ? true : router.createUrlTree([auth.landingRoute(user.role)]);
};
