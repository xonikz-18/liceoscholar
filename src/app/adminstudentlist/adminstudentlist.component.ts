import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { describeHttpError } from '../services/api.config';
import { DEFAULT_STUDENT_STATUS, STUDENT_STATUS_OPTIONS } from '../services/models';
import type { StudentStatus } from '../services/models';
import { StudentService } from '../services/student.service';

type FilterKey = 'scholarshipType' | 'course' | 'yearLevel' | 'status';

interface Student {
  id: string;
  name: string;
  course: string;
  yearLevel: string;
  scholarshipType: string;
  status: StudentStatus;
}

@Component({
  selector: 'app-adminstudentlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adminstudentlist.component.html',
  styleUrl: './adminstudentlist.component.scss'
})
export class AdminstudentlistComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly studentsApi = inject(StudentService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly filterKeys: FilterKey[] = ['scholarshipType', 'course', 'yearLevel', 'status'];
  searchTerm = '';
  activeFilter: FilterKey | null = null;

  selectedFilters: Record<FilterKey, string | null> = {
    scholarshipType: null,
    course: null,
    yearLevel: null,
    status: null
  };

  readonly filterLabels: Record<FilterKey, string> = {
    scholarshipType: 'Scholarship Type',
    course: 'Course',
    yearLevel: 'Year Level',
    status: 'Status'
  };

  readonly filterOptions: Record<FilterKey, string[]> = {
    scholarshipType: [
      'Full Academic Scholarship',
      'Half Academic Scholarship',
      'Special Scholarship'
    ],
    course: [
      'School of Business, Management, and Accountancy',
      'College of Nursing',
      'College of Law',
      'College of Arts and Science',
      'College of Information Technology',
      'College of Radiologic Technology',
      'Conservatory of Music, Theater, and Dance',
      'College of Engineering',
      'School of Teacher Education',
      'College of Rehabilitation Sciences',
      'College of Criminal Justice',
      'College of Pharmacy',
      'College of Medical Laboratory Science',
      'College of Dentistry',
      'College of Aviation'
    ],
    yearLevel: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    status: [...STUDENT_STATUS_OPTIONS]
  };

  students: Student[] = [];

  ngOnInit(): void {
    void this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    try {
      const list = await this.studentsApi.listStudents();

      this.students = list.map((student) => ({
        id: student.id,
        name: student.fullName,
        course: student.course,
        yearLevel: student.yearLevel,
        scholarshipType: student.scholarshipType,
        status: student.status ?? DEFAULT_STUDENT_STATUS
      }));
    } catch (error) {
      alert(describeHttpError(error));
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  get filteredStudents(): Student[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.students.filter((student) => {
      const matchesSearch = !search || [
        student.name,
        student.course,
        student.yearLevel,
        student.scholarshipType,
        student.status
      ].some((value) => value.toLowerCase().includes(search));

      return matchesSearch
        && (!this.selectedFilters.scholarshipType
          || this.selectedFilters.scholarshipType === 'All'
          || student.scholarshipType === this.selectedFilters.scholarshipType)
        && (!this.selectedFilters.course
          || this.selectedFilters.course === 'All'
          || student.course.toLowerCase().startsWith(this.selectedFilters.course.toLowerCase()))
        && (!this.selectedFilters.yearLevel
          || this.selectedFilters.yearLevel === 'All'
          || student.yearLevel === this.selectedFilters.yearLevel)
        && (!this.selectedFilters.status
          || this.selectedFilters.status === 'All'
          || student.status === this.selectedFilters.status);
    });
  }

  toggleFilter(key: FilterKey): void {
    this.activeFilter = this.activeFilter === key ? null : key;
  }

  /** The dot next to each student. Falls back to the default status. */
  statusClass(status: string | null | undefined): string {
    return (status ?? DEFAULT_STUDENT_STATUS).toLowerCase().replace(/\s+/g, '-');
  }

  /** The button shows the active choice, or its name when nothing is picked. */
  filterLabel(key: FilterKey): string {
    return this.selectedFilters[key] ?? this.filterLabels[key];
  }

  chooseFilter(key: FilterKey, value: string): void {
    // "All" clears the filter; clicking the active choice again does the same.
    this.selectedFilters[key] =
      value === 'All' || this.selectedFilters[key] === value ? null : value;
    this.activeFilter = null;
  }

  openStudent(student: Student): void {
    this.router.navigate(['/adminstudentview', student.id]);
  }

  /** End-of-semester reset state. */
  confirmingReset = false;
  resettingSemester = false;
  resetError = '';

  askResetSemester(): void {
    this.resetError = '';
    this.confirmingReset = true;
  }

  cancelResetSemester(): void {
    if (this.resettingSemester) return;
    this.confirmingReset = false;
    this.resetError = '';
  }

  /** Clears every submission and returns all students to "Pending". */
  async confirmResetSemester(): Promise<void> {
    if (this.resettingSemester) return;

    this.resettingSemester = true;
    this.resetError = '';

    try {
      await this.studentsApi.resetSemester();
      this.confirmingReset = false;
      await this.loadStudents();
    } catch (error) {
      this.resetError = describeHttpError(error);
    } finally {
      this.resettingSemester = false;
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