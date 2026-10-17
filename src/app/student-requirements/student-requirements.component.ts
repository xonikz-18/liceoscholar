import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { AccountService } from '../services/account.service';
import { describeHttpError, resolveFileUrl } from '../services/api.config';
import type { ApiRequirement, RequirementAnalysis } from '../services/models';
import { isAiReviewable, requirementNote } from '../services/models';
import { ScholarshipService } from '../services/scholarship.service';

interface Requirement {
  id: string;
  date: string;
  description: string;
  status: string;
  fileName: string;
  dataUrl: string;
  type: string;
  /** "none" | "running" | "done" | "error" */
  analysisState: string;
  analysisError: string;
  analysis: RequirementAnalysis | null;
  /** False for documents the scholarship office checks by hand. */
  aiReviewable: boolean;
}

interface PreviewFile {
  fileName: string;
  dataUrl: string;
  type: string;
  safeUrl: SafeResourceUrl;
  isDocument: boolean;
}

function toViewRequirement(requirement: ApiRequirement): Requirement {
  return {
    id: requirement.id,
    date: requirement.date,
    description: requirement.description,
    status: requirement.status,
    fileName: requirement.fileName,
    dataUrl: resolveFileUrl(requirement.fileUrl),
    type: requirement.mimeType,
    analysisState: requirement.analysisState ?? 'none',
    analysisError: requirement.analysisError ?? '',
    analysis: requirement.analysis ?? null,
    aiReviewable: isAiReviewable(requirement.description)
  };
}

/** Lets a student upload, view and remove the documents they must submit. */
@Component({
  selector: 'app-student-requirements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-requirements.component.html',
  styleUrl: './student-requirements.component.scss'
})
export class StudentRequirementsComponent implements OnInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly account = inject(AccountService);
  private readonly scholarshipApi = inject(ScholarshipService);

  requirements: Requirement[] = [];
  scholarshipType = '';
  requiredDocuments: string[] = [];
  preview: PreviewFile | null = null;
  uploadingIndex: number | null = null;
  /** Which requirement's AI feedback panel is open. */
  openFeedback: number | null = null;

  /**
   * Requirement the student just uploaded and is still waiting on.
   *
   * The upload response comes back before the background review has even
   * started, so without this the student would see nothing at all and have no
   * idea the AI was working on their file.
   */
  awaitingAiId: string | null = null;

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async load(): Promise<void> {
    try {
      const [profile, catalogue] = await Promise.all([
        this.account.getMyProfile(),
        this.scholarshipApi.getCatalogue()
      ]);

      this.requirements = profile.requirements.map(toViewRequirement);
      this.scholarshipType = profile.user.scholarshipType || '';
      this.requiredDocuments = catalogue.requiredDocuments;

      // Stop waiting once the review has actually produced a result.
      if (this.awaitingAiId) {
        const pending = this.requirements.find((r) => r.id === this.awaitingAiId);
        if (pending && (pending.analysisState === 'done' || pending.analysisState === 'error')) {
          this.awaitingAiId = null;
        }
      }

      this.startPollingIfNeeded();
    } catch (error) {
      alert(describeHttpError(error));
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  /**
   * True while the AI is still working on anything.
   *
   * Counts a just-uploaded file as pending even before the backend flips it to
   * "running", so the notice appears the instant the student uploads.
   */
  isAiWorking(): boolean {
    return this.awaitingAiId !== null || this.requirements.some((r) => this.isReviewing(r));
  }

  /** Names of the documents the AI is working on right now. */
  private aiWorkingLabels(): string[] {
    const labels = this.requirements.filter((r) => this.isReviewing(r)).map((r) => r.description);

    if (this.awaitingAiId) {
      const pending = this.requirements.find((r) => r.id === this.awaitingAiId);
      if (pending && !labels.includes(pending.description)) {
        labels.push(pending.description);
      }
    }

    return labels;
  }

  /** Reads naturally whether one or several documents are in progress. */
  aiWorkingLabel(): string {
    const labels = this.aiWorkingLabels();

    if (labels.length === 0) return 'document';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;

    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  }

  /** Pulls fresh data while the AI is still reviewing an uploaded file. */
  private startPollingIfNeeded(): void {
    if (!this.isAiWorking() || this.pollTimer) return;

    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      void this.load();
    }, 3000);
  }

  /** True while the automatic review is still working. */
  isReviewing(requirement: Requirement): boolean {
    return requirement.aiReviewable && requirement.analysisState === 'running';
  }

  hasVerdict(requirement: Requirement): boolean {
    return requirement.aiReviewable && requirement.analysisState === 'done' && !!requirement.analysis;
  }

  /** True when the review finished but could not read the file. */
  needsReview(requirement: Requirement): boolean {
    return requirement.aiReviewable && requirement.analysisState === 'error';
  }

  /** Reminder shown under a row, such as where to get official grades. */
  noteFor(requirement: Requirement): string {
    return requirementNote(requirement.description);
  }

  verdictClass(requirement: Requirement): string {
    return (requirement.analysis?.verdict ?? 'needs_review')
      .replace('does_not_meet', 'fails');
  }

  verdictLabel(requirement: Requirement): string {
    const verdict = requirement.analysis?.verdict;
    if (verdict === 'meets') return 'Looks good';
    if (verdict === 'does_not_meet') return 'Needs fixing';
    if (verdict === 'needs_review') return 'Check needed';
    return 'Not reviewed';
  }

  /** Expands or collapses the AI feedback panel for one requirement. */
  toggleFeedback(index: number): void {
    this.openFeedback = this.openFeedback === index ? null : index;
  }

  closeFeedback(): void {
    this.openFeedback = null;
  }

  /** Validates the chosen file and uploads it to the backend. */
  async onFileSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (!this.allowedExtensions.includes(extension)) {
      alert('Only JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, and XLSX files are allowed.');
      input.value = '';
      return;
    }

    this.uploadingIndex = index;

    try {
      const updated = await this.account.uploadRequirementFile(this.requirements[index].id, file);
      this.requirements[index] = toViewRequirement(updated);

      // Tell the student the AI is on it straight away instead of leaving them
      // staring at a file that appears to have done nothing.
      this.awaitingAiId = this.requirements[index].aiReviewable ? this.requirements[index].id : null;

      this.startPollingIfNeeded();
    } catch (error) {
      alert(describeHttpError(error));
    } finally {
      input.value = '';
      this.uploadingIndex = null;
      this.changeDetector.markForCheck();
    }
  }

  truncateFileName(name: string): string {
    return name.length > 18 ? `${name.slice(0, 13)}....` : name;
  }

  previewFile(index: number): void {
    const file = this.requirements[index];
    if (!file.fileName) return;

    const extension = file.fileName.split('.').pop()?.toLowerCase() ?? '';
    const isDocument = ['doc', 'docx', 'xls', 'xlsx'].includes(extension);

    this.preview = {
      fileName: file.fileName,
      dataUrl: file.dataUrl,
      type: file.type,
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(file.dataUrl),
      isDocument
    };
  }

  closePreview(): void {
    this.preview = null;
  }

  async removeFile(index: number): Promise<void> {
    try {
      const updated = await this.account.deleteRequirementFile(this.requirements[index].id);
      this.requirements[index] = toViewRequirement(updated);
      if (this.awaitingAiId === updated.id) this.awaitingAiId = null;
    } catch (error) {
      alert(describeHttpError(error));
    } finally {
      this.changeDetector.markForCheck();
    }
  }
}