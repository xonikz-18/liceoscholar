// Shared API types that mirror the liceoscholar-be responses.

export type UserRole = 'student' | 'admin';

export type StudentStatus = 'Pending' | 'Qualified' | 'Not Qualified';

/**
 * Status every new account starts on.
 *
 * The backend already stores "Pending" at registration; the frontend falls back
 * to the same value so a student is never shown a blank status, whatever the
 * account looked like before.
 */
export const DEFAULT_STUDENT_STATUS: StudentStatus = 'Pending';

/** The application statuses an administrator can pick from, in display order. */
export const STUDENT_STATUS_OPTIONS: readonly StudentStatus[] = [
  'Pending',
  'Qualified',
  'Not Qualified'
];

/**
 * Status of one submitted document.
 *
 * Distinct from the application status above: a document is either still
 * Pending or has been reviewed as Passed / Not Passed.
 */
export type RequirementStatus = 'Pending' | 'Passed' | 'Not Passed';

/** An account as returned by /api/auth/* and /api/me. */
export interface AuthUser {
  id: string;
  role: UserRole;
  username: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  age: number | null;
  course: string;
  yearLevel: string;
  scholarshipType: string;
  sex: string;
  suffix: string;
  status: StudentStatus | null;
  profilePhotoUrl: string;
}

/** Verdict returned by the AI requirement reviewer. */
export type AnalysisVerdict = 'meets' | 'does_not_meet' | 'needs_review';

/** AI review of a submitted requirement file. */
export interface RequirementAnalysis {
  verdict: AnalysisVerdict;
  confidence: number;
  documentType: string;
  summary: string;
  /** Advice written for the scholarship administrator. */
  recommendation: string;
  /** Advice written for the applicant: friendly and practical. */
  studentAdvice: string;
  model: string;
  analysedAt: string;
  checks: Array<{ criterion: string; passed: boolean; note: string }>;
  issues: string[];
}

/** A submitted requirement document. */
export interface ApiRequirement {
  id: string;
  description: string;
  date: string;
  status: RequirementStatus;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  analysis: RequirementAnalysis | null;
  /** "none" | "running" | "done" | "error" */
  analysisState: string;
  analysisError: string;
}

/** One scholarship tier, as shown on the student dashboard. */
export interface Scholarship {
  id: string;
  name: string;
  shortName: string;
  /** Short summary of the score needed to qualify. */
  qualification: string;
  coverage: string[];
  duration: string;
  entryRequirements: string[];
  renewalGuidelines: string[];
  programs: string[];
}

/** Scholarship qualifications plus the documents every applicant must submit. */
export interface ScholarshipCatalogue {
  scholarships: Scholarship[];
  requiredDocuments: string[];
}

/** Compact row returned by the admin student list. */
export interface StudentListItem {
  id: string;
  fullName: string;
  course: string;
  yearLevel: string;
  scholarshipType: string;
  status: StudentStatus | null;
}

export interface SignupPayload {
  fullName: string;
  /** Optional: Jr., III, IV … */
  suffix?: string;
  email: string;
  age: number;
  sex: string;
  course: string;
  yearLevel: string;
  scholarshipType: string;
  password: string;
}

export interface StudentFilters {
  search?: string;
  status?: string;
  scholarshipType?: string;
  course?: string;
  yearLevel?: string;
}

/**
 * Documents the scholarship office checks by hand.
 *
 * The university supplies its own application form, so the AI reviewer can only
 * misread it. These are never analysed.
 */
export const MANUAL_REVIEW_DOCUMENTS: readonly string[] = ['Form'];

/** True when this document should be reviewed by the AI rather than by staff. */
export function isAiReviewable(description: string): boolean {
  const target = (description ?? '').trim().toLowerCase();
  if (!target) return false;

  return !MANUAL_REVIEW_DOCUMENTS.some((doc) => doc.trim().toLowerCase() === target);
}

/** Short reminder shown underneath a requirement row. */
export const REQUIREMENT_NOTES: Readonly<Record<string, string>> = {
  '2x2 Picture': 'Please upload a recent, well-lit photo of yourself, taken in good lighting.',
  'Report Card for Semester':
    'Please get your grades from the university Registrar\'s Office and upload that sheet.',
  Form: 'This requirement will be checked manually by the admin.'
};

/** The reminder for a document, or an empty string when there isn't one. */
export function requirementNote(description: string): string {
  const target = (description ?? '').trim().toLowerCase();

  for (const [document, note] of Object.entries(REQUIREMENT_NOTES)) {
    if (document.trim().toLowerCase() === target) return note;
  }

  return '';
}
