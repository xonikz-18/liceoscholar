import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccountService } from '../services/account.service';
import type { ApiRequirement, AuthUser, Scholarship } from '../services/models';
import { ScholarshipService } from '../services/scholarship.service';

/** Student landing page: their application at a glance plus the scholarship rules. */
@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private readonly account = inject(AccountService);
  private readonly scholarshipApi = inject(ScholarshipService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  user: AuthUser | null = null;
  requirements: ApiRequirement[] = [];
  scholarships: Scholarship[] = [];
  requiredDocuments: string[] = [];
  activeScholarshipId = '';

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [profile, catalogue] = await Promise.all([
        this.account.getMyProfile(),
        this.scholarshipApi.getCatalogue()
      ]);

      this.user = profile.user;
      this.requirements = profile.requirements;
      this.scholarships = catalogue.scholarships;
      this.requiredDocuments = catalogue.requiredDocuments;

      const applied = this.scholarships.find((tier) => tier.name === this.user?.scholarshipType);
      this.activeScholarshipId = (applied ?? this.scholarships[0])?.id ?? '';
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  isApplied(tier: Scholarship): boolean {
    return tier.name === this.user?.scholarshipType;
  }

  selectScholarship(tier: Scholarship): void {
    this.activeScholarshipId = tier.id;
  }

  /** True once the student has attached a file for this document. */
  isSubmitted(description: string): boolean {
    return this.requirements.some(
      (requirement) => requirement.description === description && !!requirement.fileName
    );
  }

  /** Submission status for a document, e.g. "Qualified". */
  statusFor(description: string): string {
    const match = this.requirements.find((requirement) => requirement.description === description);
    return match?.fileName ? match.status : 'Not submitted';
  }

  submittedCount(): number {
    return this.requiredDocuments.filter((doc) => this.isSubmitted(doc)).length;
  }
}