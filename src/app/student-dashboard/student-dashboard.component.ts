import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccountService } from '../services/account.service';
import { describeHttpError } from '../services/api.config';
import { DEFAULT_STUDENT_STATUS } from '../services/models';
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
  isLoading = true;
  loadError = '';

  /** The application status, never blank: new accounts read as Pending. */
  get status(): string {
    return this.user?.status ?? DEFAULT_STUDENT_STATUS;
  }
  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';

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
    } catch (error) {
      this.loadError = describeHttpError(error);
    } finally {
      this.isLoading = false;
      this.changeDetector.markForCheck();
    }
  }

  /** True when the scholarship office has made a final decision on the application. */
  get decisionMade(): boolean {
    return this.status === 'Qualified' || this.status === 'Not Qualified';
  }

  /** Friendly label for the decision banner. */
  get decisionLabel(): string {
    return this.status === 'Qualified' ? 'Congratulations!' : 'Application Update';
  }

  /** Message shown when a final decision has been posted. */
  get decisionMessage(): string {
    return this.status === 'Qualified'
      ? 'The Scholarship Office has marked your application as Qualified. Check your email for details.'
      : 'The Scholarship Office has marked your application as Not Qualified.';
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

  /** Submission status for a document, e.g. "Passed". */
  statusFor(description: string): string {
    const match = this.requirements.find((requirement) => requirement.description === description);
    return match?.fileName ? match.status : 'Not submitted';
  }

  submittedCount(): number {
    return this.requiredDocuments.filter((doc) => this.isSubmitted(doc)).length;
  }
}