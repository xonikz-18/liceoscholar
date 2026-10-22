import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Allows only signed-in administrators into the admin portal. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // A student who opens an admin link goes to their own portal.
  return user.role === 'admin' ? true : router.createUrlTree([auth.landingRoute(user.role)]);
};
