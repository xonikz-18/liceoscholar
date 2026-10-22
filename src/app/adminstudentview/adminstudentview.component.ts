import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { describeHttpError, resolveFileUrl } from '../services/api.config';
import { formatDateOfBirth } from '../services/date';
import type { RequirementAnalysis, RequirementStatus, StudentStatus } from '../services/models';
import { DEFAULT_STUDENT_STATUS, STUDENT_STATUS_OPTIONS, isAiReviewable } from '../services/models';
import { StudentService } from '../services/student.service';

interface StudentDetails {
  name: string;
  suffix: string;
  email: string;
  course: string;
  yearLevel: string;
  /** `MM/DD/YYYY`, or a dash for accounts created before the field existed. */
  dateOfBirth: string;
  sex: string;
  scholarshipType: string;
  /** Application status; new accounts start on "Pending". */
  status: StudentStatus;
  /** Empty when the student has not uploaded a picture. */
  photoUrl: string;
}

interface StudentRequirement {
  id: string;
  date: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  description: string;
  status: RequirementStatus;
  analysis: RequirementAnalysis | null;
  analysisState: string;
  analysisError: string;
  /** False for documents the scholarship office checks by hand. */
  aiReviewable: boolean;
}

@Component({
  selector: 'app-adminstudentview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adminstudentview.component.html',
  styleUrl: './adminstudentview.component.scss'
})
export class AdminstudentviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsApi = inject(StudentService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  @Input() studentId: string | null = null;

  student: StudentDetails | undefined;
  requirements: StudentRequirement[] = [];

  readonly statusOptions: RequirementStatus[] = ['Pending', 'Passed', 'Not Passed'];
  openStatusIndex: number | null = null;

  /** The three application statuses an administrator can set. */
  readonly studentStatusOptions = STUDENT_STATUS_OPTIONS;

  /** Application status menu on the student's own card. */
  applicationStatusOpen = false;
  savingApplicationStatus = false;

  /** Requirement currently being reviewed by the AI, if any. */
  analyzingId: string | null = null;
  /** Requirement whose result popup is open, or null. */
  openAnalysisIndex: number | null = null;
  analysisError = '';

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Reloads quietly while a review is still running so the verdict appears as
   * soon as the backend finishes, without the administrator doing anything.
   */
  private startPollingIfNeeded(): void {
    const running = this.requirements.some(
      (requirement) => requirement.aiReviewable && requirement.analysisState === 'running'
    );

    if (!running || this.pollTimer) {
      return;
    }

    this.pollTimer = setTimeout(async () => {
      this.pollTimer = null;

      if (!this.currentStudentId) return;

      try {
        const { requirements } = await this.studentsApi.getStudent(this.currentStudentId);

        this.requirements = requirements.map((requirement) => ({
          id: requirement.id,
          date: requirement.date,
          fileName: requirement.fileName,
          fileUrl: resolveFileUrl(requirement.fileUrl),
          mimeType: requirement.mimeType,
          description: requirement.description,
          status: requirement.status,
          analysis: requirement.analysis ?? null,
          analysisState: requirement.analysisState ?? 'none',
          analysisError: requirement.analysisError ?? '',
          aiReviewable: isAiReviewable(requirement.description)
        }));

        this.startPollingIfNeeded();
      } catch {
        /* Leave the current state alone and stop polling. */
      } finally {
        this.changeDetector.markForCheck();
      }
    }, 3000);
  }

  /** True while the automatic review is still working on this file. */
  isReviewing(requirement: StudentRequirement): boolean {
    return requirement.aiReviewable && requirement.analysisState === 'running';
  }

  /** True when the review finished and a verdict is available to show. */
  hasVerdict(requirement: StudentRequirement): boolean {
    return requirement.aiReviewable && requirement.analysisState === 'done' && !!requirement.analysis;
  }

  /**
   * True for documents the scholarship office reads by hand, such as the
   * university's own application form. The AI never looks at these.
   */
  isManualReview(requirement: StudentRequirement): boolean {
    return !requirement.aiReviewable;
  }

  /** Turns a status into a CSS class: "Not Passed" becomes "not-passed". */
  statusClass(status: string | null | undefined): string {
    return (status ?? DEFAULT_STUDENT_STATUS).toLowerCase().replace(/\s+/g, '-');
  }

  /** CSS class for an AI verdict. */
  verdictClass(verdict: string): string {
    return verdict === 'meets' ? 'meets' : verdict === 'does_not_meet' ? 'fails' : 'review';
  }

  /** Human label for an AI verdict. */
  verdictLabel(verdict: string): string {
    return verdict === 'meets'
      ? 'Meets requirements'
      : verdict === 'does_not_meet'
        ? 'Does not meet requirements'
        : 'Needs manual review';
  }

  /** Shorter verdict label, used inside the narrow requirement row. */
  verdictLabelShort(verdict: string): string {
    return verdict === 'meets'
      ? 'Meets'
      : verdict === 'does_not_meet'
        ? 'Does not meet'
        : 'Review needed';
  }

  private currentStudentId: string | null = null;

  /** True when the student's profile photo is missing from the server. */
  photoFailed = false;

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ngOnInit(): void {
    this.currentStudentId = this.studentId ?? this.route.snapshot.paramMap.get('studentId');

    if (this.currentStudentId) {
      void this.loadStudent(this.currentStudentId);
    }
  }

  private async loadStudent(studentId: string): Promise<void> {
    try {
      const { student, requirements } = await this.studentsApi.getStudent(studentId);

      this.photoFailed = false;
      this.student = {
        name: student.fullName,
        suffix: student.suffix || 'N/A',
        email: student.email || '—',
        course: student.course || '—',
        yearLevel: student.yearLevel || '—',
        dateOfBirth: formatDateOfBirth(student.dateOfBirth) || '—',
        sex: student.sex || 'N/A',
        scholarshipType: student.scholarshipType || '—',
        status: student.status ?? DEFAULT_STUDENT_STATUS,
        photoUrl: resolveFileUrl(student.profilePhotoUrl)
      };

      this.requirements = requirements.map((requirement) => ({
        id: requirement.id,
        date: requirement.date,
        fileName: requirement.fileName,
        fileUrl: resolveFileUrl(requirement.fileUrl),
        mimeType: requirement.mimeType,
        description: requirement.description,
        status: requirement.status,
        analysis: requirement.analysis ?? null,
        analysisState: requirement.analysisState ?? 'none',
        analysisError: requirement.analysisError ?? '',
        aiReviewable: isAiReviewable(requirement.description)
      }));

      this.startPollingIfNeeded();
    } catch (error) {
      this.student = undefined;
      this.requirements = [];
      alert(describeHttpError(error));
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  toggleStatus(index: number): void {
    // Nothing to review without a file, so the menu never opens.
    if (!this.requirements[index]?.fileUrl) return;

    this.openStatusIndex = this.openStatusIndex === index ? null : index;
    this.applicationStatusOpen = false;
  }

  /**
   * True once every document has been reviewed.
   *
   * The application status can only be decided after all three requirements
   * have been marked, so the control stays locked until then.
   */
  get requirementsReviewed(): boolean {
    return (
      this.requirements.length > 0 &&
      this.requirements.every((requirement) => requirement.status !== 'Pending')
    );
  }

  /** Documents still waiting for a decision, shown as the lock reason. */
  get pendingRequirementCount(): number {
    return this.requirements.filter((requirement) => requirement.status === 'Pending').length;
  }

  /** Explains why the application status cannot be changed yet. */
  get applicationStatusLockedReason(): string {
    if (this.requirementsReviewed) return '';

    const pending = this.pendingRequirementCount;
    return (
      `Review the remaining ${pending} document${pending === 1 ? '' : 's'} first ` +
      'before deciding the application status.'
    );
  }

  toggleApplicationStatus(): void {
    // The decision is locked until every document has been reviewed.
    if (!this.requirementsReviewed) return;

    this.applicationStatusOpen = !this.applicationStatusOpen;
    this.openStatusIndex = null;
  }

  /** Saves the student's application status, restoring it if the call fails. */
  async setApplicationStatus(status: StudentStatus): Promise<void> {
    const student = this.student;
    if (!student || !this.currentStudentId || this.savingApplicationStatus) return;

    const previousStatus = student.status;
    this.applicationStatusOpen = false;

    if (status === previousStatus) return;

    // "Pending" is always allowed; a final decision needs every document
    // reviewed first.
    if (status !== 'Pending' && !this.requirementsReviewed) {
      alert(this.applicationStatusLockedReason);
      return;
    }

    this.savingApplicationStatus = true;
    this.student = { ...student, status };

    try {
      const updated = await this.studentsApi.updateStudent(this.currentStudentId, { status });
      this.student = { ...student, status: updated.status ?? status };
    } catch (error) {
      this.student = { ...student, status: previousStatus };
      alert(describeHttpError(error));
    } finally {
      this.savingApplicationStatus = false;
      this.changeDetector.markForCheck();
    }
  }

  /** Runs the AI reviewer over this requirement and stores its verdict. */
  async analyze(index: number): Promise<void> {
    const requirement = this.requirements[index];
    if (!requirement || this.analyzingId) return;

    // The AI is never run over documents staff check by hand.
    if (!requirement.aiReviewable) {
      alert(`The "${requirement.description}" is checked manually by the scholarship office.`);
      return;
    }

    this.analysisError = '';
    this.analyzingId = requirement.id;
    this.requirements[index] = { ...requirement, analysisState: 'running', analysisError: '' };
    this.changeDetector.markForCheck();

    try {
      const updated = await this.studentsApi.analyzeRequirement(requirement.id);
      this.requirements[index] = {
        ...requirement,
        status: updated.status,
        analysis: updated.analysis ?? null,
        analysisState: updated.analysisState ?? 'done',
        analysisError: updated.analysisError ?? ''
      };
      this.openAnalysisIndex = index;
    } catch (error) {
      this.requirements[index] = {
        ...requirement,
        analysisState: 'error',
        analysisError: describeHttpError(error)
      };
      this.openAnalysisIndex = index;
    } finally {
      this.analyzingId = null;
      this.changeDetector.markForCheck();
    }
  }

  toggleAnalysis(index: number): void {
    this.openAnalysisIndex = this.openAnalysisIndex === index ? null : index;
  }

  closeAnalysis(): void {
    this.openAnalysisIndex = null;
    this.analysisError = '';
  }

  /** Requirement whose uploaded file is being previewed, if any. */
  preview: StudentRequirement | null = null;

  /** True when the previewed image could not be loaded (the file is missing). */
  previewImageFailed = false;

  /** Opens the uploaded file for viewing. */
  openPreview(requirement: StudentRequirement): void {
    if (!requirement.fileUrl) return;
    this.preview = requirement;
    this.previewImageFailed = false;
  }

  closePreview(): void {
    this.preview = null;
    this.previewImageFailed = false;
  }

  /** True when the browser can render the file inline as an image. */
  isImage(mimeType: string): boolean {
    return /^image\//i.test(mimeType || '');
  }

  /** Saves the new status through the API, restoring it if the call fails. */
  async setStatus(index: number, status: RequirementStatus): Promise<void> {
    const requirement = this.requirements[index];

    // A document has to exist before it can be judged.
    if (!requirement.fileUrl) {
      this.openStatusIndex = null;
      return;
    }

    const previousStatus = requirement.status;
    this.openStatusIndex = null;

    try {
      const updated = await this.studentsApi.updateRequirementStatus(requirement.id, status);
      this.requirements[index] = { ...requirement, status: updated.status };
    } catch (error) {
      this.requirements[index] = { ...requirement, status: previousStatus };
      alert(describeHttpError(error));
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  backToStudentList(): void {
    this.router.navigate(['/adminstudentlist']);
  }

  /** Delete-account confirmation state. */
  confirmingDelete = false;
  deletingAccount = false;
  deleteError = '';

  askDeleteAccount(): void {
    this.deleteError = '';
    this.confirmingDelete = true;
  }

  cancelDeleteAccount(): void {
    if (this.deletingAccount) return;
    this.confirmingDelete = false;
    this.deleteError = '';
  }

  /** Removes the student, then returns to the list they came from. */
  async confirmDeleteAccount(): Promise<void> {
    const studentId = this.currentStudentId;
    if (!studentId || this.deletingAccount) return;

    this.deletingAccount = true;
    this.deleteError = '';

    try {
      await this.studentsApi.deleteStudent(studentId);
      this.confirmingDelete = false;
      this.router.navigate(['/adminstudentlist']);
    } catch (error) {
      this.deleteError = describeHttpError(error);
    } finally {
      this.deletingAccount = false;
      this.changeDetector.markForCheck();
    }
  }

  openAdminProfile(): void {
    this.router.navigate(['/adminprofile']);
  }

  logout(): void {
    this.router.navigate([{ outlets: { modal: ['logout'] } }], {
      state: { returnUrl: this.router.url }
    });
  }
}
