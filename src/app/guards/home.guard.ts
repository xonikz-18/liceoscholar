import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Handles the bare `/` (and any unknown URL): a signed-in account is sent to
 * its portal, everyone else to the login page.
 *
 * Without this, refreshing the site root always landed on `/login`, which made
 * a perfectly valid session look like it had been signed out.
 */
export const homeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();

  return router.createUrlTree([user ? auth.landingRoute(user.role) : '/login']);
};
