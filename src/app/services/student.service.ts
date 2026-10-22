import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { API_BASE_URL } from './api.config';
import type {
  ApiRequirement,
  AuthUser,
  RequirementStatus,
  StudentFilters,
  StudentListItem
} from './models';

interface StudentListResponse {
  students: StudentListItem[];
}

interface StudentResponse {
  student: AuthUser;
  requirements: ApiRequirement[];
}

interface RequirementResponse {
  requirement: ApiRequirement;
}

/** Outcome of closing a semester. */
export interface SemesterResetSummary {
  status: string;
  studentsReset: number;
  requirementsCleared: number;
}

/** Administrator endpoints for browsing students and reviewing requirements. */
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);

  async listStudents(filters: StudentFilters = {}): Promise<StudentListItem[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params = params.set(key, value);
      }
    }

    const response = await lastValueFrom(
      this.http.get<StudentListResponse>(`${API_BASE_URL}/students`, { params })
    );
    return response.students;
  }

  async getStudent(studentId: string): Promise<StudentResponse> {
    return lastValueFrom(
      this.http.get<StudentResponse>(`${API_BASE_URL}/students/${studentId}`)
    );
  }

  async updateStudent(
    studentId: string,
    patch: Partial<Pick<AuthUser, 'status' | 'fullName' | 'course' | 'yearLevel' | 'scholarshipType' | 'dateOfBirth' | 'sex' | 'suffix'>>
  ): Promise<AuthUser> {
    const response = await lastValueFrom(
      this.http.patch<{ student: AuthUser }>(`${API_BASE_URL}/students/${studentId}`, patch)
    );
    return response.student;
  }

  /** Permanently removes a student and everything they submitted. */
  async deleteStudent(studentId: string): Promise<void> {
    await lastValueFrom(
      this.http.delete<{ status: string }>(`${API_BASE_URL}/students/${studentId}`)
    );
  }

  /**
   * Closes the semester: clears every submission and puts every student back on
   * "Pending". Accounts and profile details are kept.
   */
  async resetSemester(): Promise<SemesterResetSummary> {
    return lastValueFrom(
      this.http.post<SemesterResetSummary>(`${API_BASE_URL}/students/reset-semester`, {})
    );
  }

  /** Approve or disapprove a single requirement. */
  async updateRequirementStatus(
    requirementId: string,
    status: RequirementStatus
  ): Promise<ApiRequirement> {
    const response = await lastValueFrom(
      this.http.patch<RequirementResponse>(`${API_BASE_URL}/requirements/${requirementId}`, {
        status
      })
    );
    return response.requirement;
  }

  /** Asks the backend to run the AI reviewer over this requirement's file. */
  async analyzeRequirement(requirementId: string): Promise<ApiRequirement> {
    const response = await lastValueFrom(
      this.http.post<RequirementResponse>(`${API_BASE_URL}/requirements/${requirementId}/analyze`, {})
    );
    return response.requirement;
  }
}
