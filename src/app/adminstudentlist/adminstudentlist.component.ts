import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type FilterKey = 'scholarshipType' | 'course' | 'yearLevel' | 'status';
type StudentStatus = 'Active' | 'Pending' | 'Inactive';

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
export class AdminstudentlistComponent {
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
    course: ['BSIT', 'SBMA', 'COE', 'CON', 'COM', 'CAS', 'CRS', 'CCJ', 'COP', 'CMLS', 'COD', 'COL', 'COA'],
    yearLevel: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    status: ['Active', 'Pending', 'Inactive']
  };

  readonly students: Student[] = [
    {
      id: 'samantha-oliveros',
      name: 'Oliveros, Samantha G. R.',
      course: 'BSIT',
      yearLevel: '3rd Year',
      scholarshipType: 'Full Academic Scholarship',
      status: 'Active'
    },
    {
      id: 'nikki-pacatang',
      name: 'Pacatang, Nikki U.',
      course: 'BSIT',
      yearLevel: '3rd Year',
      scholarshipType: 'Half Academic Scholarship',
      status: 'Pending'
    },
    {
      id: 'christy-reyes',
      name: 'Reyes, Christy Ann E.',
      course: 'BSIT',
      yearLevel: '3rd Year',
      scholarshipType: 'Non-Academic Scholarship',
      status: 'Pending'
    },
    {
      id: 'teddy-bean',
      name: 'Bean, Teddy Mc. Q.',
      course: 'BSOT',
      yearLevel: '2nd Year',
      scholarshipType: 'Full Academic Scholarship',
      status: 'Inactive'
    }
  ];

  constructor(private router: Router) {}

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
