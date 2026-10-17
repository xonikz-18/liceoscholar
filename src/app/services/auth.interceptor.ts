import type { HttpInterceptorFn } from '@angular/common/http';

import { readToken } from './session';

/** Attaches the stored bearer token to every outgoing API request. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = readToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  );
};
