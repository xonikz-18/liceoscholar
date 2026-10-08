import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type RequirementStatus = 'Pending' | 'Approved' | 'Disapproved';

interface StudentDetails {
  name: string;
  suffix: string;
  course: string;
  yearLevel: string;
  age: string;
  sex: string;
  scholarshipType: string;
}

interface StudentRequirement {
  date: string;
  fileName: string;
  description: string;
  status: RequirementStatus;
}

function isRequirementStatus(value: unknown): value is RequirementStatus {
  return value === 'Pending' || value === 'Approved' || value === 'Disapproved';
}

@Component({
  selector: 'app-adminstudentview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adminstudentview.component.html',
  styleUrl: './adminstudentview.component.scss'
})
export class AdminstudentviewComponent implements OnInit {
  @Input() studentId: string | null = null;

  student: StudentDetails | undefined;
  readonly requirements: StudentRequirement[] = [
    { date: '08/06/2026', fileName: 'Christy2x2.png', description: '2x2 Picture', status: 'Pending' },
    { date: '08/06/2026', fileName: 'myreportcard.png', description: 'Report Card for Semester', status: 'Approved' },
    { date: '08/06/2026', fileName: 'screenshot4042_123112.png', description: 'Form', status: 'Disapproved' }
  ];

  readonly statusOptions: RequirementStatus[] = ['Pending', 'Approved', 'Disapproved'];
  openStatusIndex: number | null = null;

  private readonly students: Record<string, StudentDetails> = {
    'christy-reyes': {
      name: 'Reyes, Christy Ann E.',
      suffix: 'N/A',
      course: 'BSIT - CISCO',
      yearLevel: '3rd Year',
      age: '20',
      sex: 'Female',
      scholarshipType: 'Non - Academic Scholarship'
    },
    'samantha-oliveros': {
      name: 'Oliveros, Samantha G. R.',
      suffix: 'N/A',
      course: 'BSIT',
      yearLevel: '3rd Year',
      age: '20',
      sex: 'Female',
      scholarshipType: 'Full Academic Scholarship'
    },
    'nikki-pacatang': {
      name: 'Pacatang, Nikki U.',
      suffix: 'N/A',
      course: 'BSIT',
      yearLevel: '3rd Year',
      age: '20',
      sex: 'Female',
      scholarshipType: 'Half Academic Scholarship'
    },
    'teddy-bean': {
      name: 'Bean, Teddy Mc. Q.',
      suffix: 'N/A',
      course: 'BSOT',
      yearLevel: '2nd Year',
      age: '20',
      sex: 'Male',
      scholarshipType: 'Full Academic Scholarship'
    }
  };

  private currentStudentId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.currentStudentId = this.studentId ?? this.route.snapshot.paramMap.get('studentId');
    this.student = this.currentStudentId ? this.students[this.currentStudentId] : undefined;
    if (this.currentStudentId && this.student) {
      this.loadSavedStatuses(this.currentStudentId);
    }
  }

  toggleStatus(index: number): void {
    this.openStatusIndex = this.openStatusIndex === index ? null : index;
  }

  setStatus(index: number, status: RequirementStatus): void {
    const previousStatus = this.requirements[index].status;
    this.requirements[index].status = status;

    try {
      if (!this.currentStudentId) {
        throw new Error('Cannot save requirement status without a student ID.');
      }

      const savedStatuses = this.requirements.map((requirement) => requirement.status);
      localStorage.setItem(this.statusStorageKey(this.currentStudentId), JSON.stringify(savedStatuses));
      this.openStatusIndex = null;
    } catch (error) {
      this.requirements[index].status = previousStatus;
      console.error('Unable to save the requirement status.', error);
      alert('Unable to save this status. Please try again.');
    }
  }

  backToStudentList(): void {
    this.router.navigate(['/adminstudentlist']);
  }

  openAdminProfile(): void {
    this.router.navigate(['/adminprofile']);
  }

  logout(): void {
    this.router.navigate(['/logout'], { state: { returnUrl: this.router.url } });
  }

  private loadSavedStatuses(studentId: string): void {
    try {
      const savedValue = localStorage.getItem(this.statusStorageKey(studentId));
      if (!savedValue) {
        return;
      }

      const savedStatuses: unknown = JSON.parse(savedValue);
      if (
        !Array.isArray(savedStatuses)
        || savedStatuses.length !== this.requirements.length
        || !savedStatuses.every(isRequirementStatus)
      ) {
        throw new Error('Saved requirement statuses have an invalid format.');
      }

      savedStatuses.forEach((status, index) => {
        this.requirements[index].status = status;
      });
    } catch (error) {
      console.error('Unable to load saved requirement statuses.', error);
      alert('Saved requirement statuses could not be loaded. Default statuses are being shown.');
    }
  }

  private statusStorageKey(studentId: string): string {
    return `adminStudentRequirementStatuses:${studentId}`;
  }
}
