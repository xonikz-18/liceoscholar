import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { API_BASE_URL } from './api.config';
import type { AuthUser, SignupPayload, UserRole } from './models';
import {
  clearSession,
  readStoredUser,
  readToken,
  writeSession,
  writeUser
} from './session';

interface SessionResponse {
  token: string;
  user: AuthUser;
}

interface RegisterResponse {
  user: AuthUser;
  emailVerified: boolean;
}

/** Response from POST /auth/forgot-password. */
export interface PasswordResetRequest {
  status: string;
  /** Seconds until the emailed code stops working. */
  expiresInSeconds: number;
  /** Seconds before another code may be requested. */
  resendAfterSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userState = signal<AuthUser | null>(readStoredUser());
  /** In-flight session restore, so several guards share one API call. */
  private restoreAttempt: Promise<AuthUser | null> | null = null;

  readonly user = this.userState.asReadonly();
  readonly isLoggedIn = computed(() => this.userState() !== null && readToken() !== null);
  readonly isAdmin = computed(() => this.userState()?.role === 'admin');
  readonly isStudent = computed(() => this.userState()?.role === 'student');

  /** Signs in a student (by email) or an administrator (by username). */
  async login(identifier: string, password: string): Promise<AuthUser> {
    const response = await lastValueFrom(
      this.http.post<SessionResponse>(`${API_BASE_URL}/auth/login`, { identifier, password })
    );
    this.applySession(response);
    return response.user;
  }

  /** Creates an unverified student account. */
  async register(payload: SignupPayload): Promise<AuthUser> {
    const response = await lastValueFrom(
      this.http.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, payload)
    );
    return response.user;
  }

  /** Confirms a pending signup using the token from the emailed link. */
  async verifyEmailToken(token: string): Promise<AuthUser> {
    const response = await lastValueFrom(
      this.http.post<SessionResponse>(`${API_BASE_URL}/auth/verify-email`, { token })
    );
    this.applySession(response);
    return response.user;
  }

  /** Asks the API to re-send the verification email for an unconfirmed account. */
  async resendVerification(email: string): Promise<void> {
    await lastValueFrom(
      this.http.post(`${API_BASE_URL}/auth/resend-verification`, { email })
    );
  }

  /** Emails a 4-digit password-reset code to the account's address. */
  async forgotPassword(email: string): Promise<PasswordResetRequest> {
    return lastValueFrom(
      this.http.post<PasswordResetRequest>(`${API_BASE_URL}/auth/forgot-password`, { email })
    );
  }

  /** Sets a new password using the code from the reset email. */
  async resetPassword(email: string, code: string, password: string): Promise<void> {
    await lastValueFrom(
      this.http.post(`${API_BASE_URL}/auth/reset-password`, { email, code, password })
    );
  }

  /** Stores a refreshed copy of the current account (e.g. after a photo upload). */
  updateUser(user: AuthUser): void {
    this.userState.set(user);
    writeUser(user);
  }

  /** Landing page for a signed-in account. */
  landingRoute(role: UserRole): string {
    return role === 'admin' ? '/adminstudentlist' : '/studentview';
  }

  /**
   * Returns the signed-in account, restoring it from the API when a token is
   * stored but the cached copy is missing.
   *
   * A page refresh keeps the cached copy, so this normally answers instantly
   * without a request. The API is only consulted when storage is incomplete,
   * which keeps a valid session from being mistaken for a signed-out one.
   */
  async ensureUser(): Promise<AuthUser | null> {
    const cached = this.userState();
    if (cached) {
      return cached;
    }

    if (!readToken()) {
      return null;
    }

    if (!this.restoreAttempt) {
      this.restoreAttempt = lastValueFrom(
        this.http.get<{ user: AuthUser }>(`${API_BASE_URL}/me`)
      )
        .then(({ user }) => {
          this.userState.set(user);
          writeUser(user);
          return user;
        })
        .catch((error: unknown) => {
          // A rejected token is useless; drop it. A network hiccup is not the
          // same as being signed out, so keep the session in that case.
          const status = (error as { status?: number }).status;
          if (status === 401 || status === 403) {
            this.logout();
          }
          return null;
        })
        .finally(() => {
          this.restoreAttempt = null;
        });
    }

    return this.restoreAttempt;
  }

  logout(): void {
    clearSession();
    this.userState.set(null);
  }

  private applySession(response: SessionResponse): void {
    this.userState.set(response.user);
    writeSession(response.token, response.user);
  }
}
