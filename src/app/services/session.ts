// Session persistence for the JSON web token and the signed-in account.

import type { AuthUser } from './models';

const TOKEN_KEY = 'liceoscholar.token';
const USER_KEY = 'liceoscholar.user';

// Kept in sync so any code that still reads the old keys keeps working.
const LEGACY_LOGGED_IN = 'isLoggedIn';
const LEGACY_ROLE = 'userRole';
const LEGACY_EMAIL = 'userEmail';

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    writeUser(user);
  } catch {
    /* Storage may be unavailable (private mode); the in-memory state still works. */
  }
}

export function writeUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_LOGGED_IN, 'true');
    localStorage.setItem(LEGACY_ROLE, user.role);
    localStorage.setItem(LEGACY_EMAIL, user.email || user.username);
  } catch {
    /* ignore */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_LOGGED_IN);
    localStorage.removeItem(LEGACY_ROLE);
    localStorage.removeItem(LEGACY_EMAIL);
    // A signup waiting on email confirmation used to be stored here. It is no
    // longer used, so clear it out so it can never pre-fill a form again.
    sessionStorage.removeItem('liceoscholar.pendingEmail');
  } catch {
    /* ignore */
  }
}
