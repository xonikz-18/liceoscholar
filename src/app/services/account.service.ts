import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { API_BASE_URL } from './api.config';
import type { ApiRequirement, AuthUser } from './models';

interface MeResponse {
  user: AuthUser;
  requirements: ApiRequirement[];
}

interface UserResponse {
  user: AuthUser;
}

interface RequirementResponse {
  requirement: ApiRequirement;
}

/**
 * Endpoints under /api/me — the account behind the current session.
 * Used by both students and the administrator (profile + photo).
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  /** Current account; requirements are only populated for students. */
  async getMyProfile(): Promise<MeResponse> {
    return lastValueFrom(this.http.get<MeResponse>(`${API_BASE_URL}/me`));
  }

  async updateMyProfile(
    patch: Partial<Pick<AuthUser, 'fullName' | 'age' | 'sex' | 'suffix' | 'scholarshipType'>>
  ): Promise<AuthUser> {
    const response = await lastValueFrom(
      this.http.patch<UserResponse>(`${API_BASE_URL}/me`, patch)
    );
    return response.user;
  }

  /** Uploads a cropped profile picture for the current account. */
  async uploadProfilePhoto(file: File): Promise<AuthUser> {
    const form = new FormData();
    form.append('photo', file);
    const response = await lastValueFrom(
      this.http.post<UserResponse>(`${API_BASE_URL}/me/photo`, form)
    );
    return response.user;
  }

  /** Student uploads (or replaces) the file attached to a requirement. */
  async uploadRequirementFile(requirementId: string, file: File): Promise<ApiRequirement> {
    const form = new FormData();
    form.append('file', file);
    const response = await lastValueFrom(
      this.http.post<RequirementResponse>(
        `${API_BASE_URL}/me/requirements/${requirementId}/file`,
        form
      )
    );
    return response.requirement;
  }

  /** Student removes the file attached to a requirement. */
  async deleteRequirementFile(requirementId: string): Promise<ApiRequirement> {
    const response = await lastValueFrom(
      this.http.delete<RequirementResponse>(
        `${API_BASE_URL}/me/requirements/${requirementId}/file`
      )
    );
    return response.requirement;
  }
}
