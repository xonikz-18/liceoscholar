import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { describeHttpError } from '../services/api.config';
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
      'Non-Academic Scholarship'
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
    status: ['Pending', 'Qualified', 'Not Qualified']
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
        status: student.status ?? 'Pending'
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

  /** Turns a status into a CSS class: "Not Qualified" becomes "not-qualified". */
  statusClass(status: string | null | undefined): string {
    return (status ?? 'Pending').toLowerCase().replace(/\s+/g, '-');
  }

  chooseFilter(key: FilterKey, value: string): void {
    this.selectedFilters[key] = this.selectedFilters[key] === value ? null : value;
    this.activeFilter = null;
  }

  openStudent(student: Student): void {
    this.router.navigate(['/adminstudentview', student.id]);
  }

  openAdminProfile(): void {
    this.router.navigate(['/adminprofile']);
  }

  logout(): void {
    this.router.navigate(['/logout'], { state: { returnUrl: this.router.url } });
  }
}
