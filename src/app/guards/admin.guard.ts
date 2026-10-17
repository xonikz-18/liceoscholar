import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Allows only signed-in administrators into the admin portal. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user()?.role === 'admin'
    ? true
    : router.createUrlTree(['/login']);
};
