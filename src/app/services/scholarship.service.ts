import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

import { API_BASE_URL } from './api.config';
import type { ScholarshipCatalogue } from './models';

/** Supplies the scholarship qualifications and requirements shown to students. */
@Injectable({ providedIn: 'root' })
export class ScholarshipService {
  private readonly http = inject(HttpClient);

  /** Reads the scholarship tiers and the required documents from the API. */
  getCatalogue(): Promise<ScholarshipCatalogue> {
    return lastValueFrom(
      this.http.get<ScholarshipCatalogue>(`${API_BASE_URL}/scholarships`)
    );
  }
}