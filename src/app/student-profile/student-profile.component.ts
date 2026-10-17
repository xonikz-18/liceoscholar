import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProfilePhotoEditorComponent } from '../profile-photo-editor/profile-photo-editor.component';
import { AccountService } from '../services/account.service';
import { describeHttpError } from '../services/api.config';
import { AuthService } from '../services/auth.service';
import type { AuthUser, Scholarship } from '../services/models';
import { ScholarshipService } from '../services/scholarship.service';

/** Shows everything the student entered at sign up, and allows editing the scholarship type. */
@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePhotoEditorComponent],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.scss'
})
export class StudentProfileComponent implements OnInit {
  private readonly account = inject(AccountService);
  private readonly auth = inject(AuthService);
  private readonly scholarshipApi = inject(ScholarshipService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  user: AuthUser | null = null;
  scholarships: Scholarship[] = [];

  /** The scholarship type being edited. */
  selectedScholarship = '';
  editingScholarship = false;
  savingScholarship = false;
  scholarshipMessage = '';
  scholarshipError = '';
  private originalScholarship = '';

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
      this.scholarships = catalogue.scholarships;
      this.originalScholarship = profile.user.scholarshipType || '';
      this.selectedScholarship = this.originalScholarship;
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  /** Qualification summary for the scholarship currently applied for. */
  get appliedScholarship(): Scholarship | undefined {
    return this.scholarships.find((tier) => tier.name === this.user?.scholarshipType);
  }

  startEditScholarship(): void {
    this.selectedScholarship = this.user?.scholarshipType ?? '';
    this.scholarshipMessage = '';
    this.scholarshipError = '';
    this.editingScholarship = true;
  }

  cancelEditScholarship(): void {
    this.selectedScholarship = this.originalScholarship;
    this.scholarshipMessage = '';
    this.scholarshipError = '';
    this.editingScholarship = false;
  }

  /** Saves the new scholarship type and refreshes the signed-in account. */
  async saveScholarship(): Promise<void> {
    if (!this.selectedScholarship) {
      this.scholarshipError = 'Choose a scholarship first.';
      return;
    }

    if (this.selectedScholarship === this.originalScholarship) {
      this.cancelEditScholarship();
      return;
    }

    this.savingScholarship = true;
    this.scholarshipError = '';
    this.scholarshipMessage = '';

    try {
      const updated = await this.account.updateMyProfile({ scholarshipType: this.selectedScholarship });

      this.user = updated;
      this.originalScholarship = updated.scholarshipType;
      this.auth.updateUser(updated);
      this.editingScholarship = false;
      this.scholarshipMessage = 'Scholarship type updated. Your uploaded files are being reviewed again.';
    } catch (error) {
      this.scholarshipError = describeHttpError(error);
    } finally {
      this.savingScholarship = false;
      this.changeDetector.markForCheck();
    }
  }
}