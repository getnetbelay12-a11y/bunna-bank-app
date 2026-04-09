import { Injectable } from '@nestjs/common';

const ENROLLMENT_FIXTURES = [
  {
    enrollmentId: 'ENR-1001',
    schoolId: 'school_blue_nile',
    studentId: 'ST-1001',
    academicYear: '2026',
    grade: 'Grade 7',
    section: 'A',
    rollNumber: '07-001',
    status: 'active',
  },
  {
    enrollmentId: 'ENR-1002',
    schoolId: 'school_blue_nile',
    studentId: 'ST-1002',
    academicYear: '2026',
    grade: 'Grade 9',
    section: 'B',
    rollNumber: '09-014',
    status: 'active',
  },
  {
    enrollmentId: 'ENR-2001',
    schoolId: 'school_tana',
    studentId: 'ST-2001',
    academicYear: '2026',
    grade: 'Grade 5',
    section: 'C',
    rollNumber: '05-022',
    status: 'awaiting_fee_assignment',
  },
];

@Injectable()
export class EnrollmentsService {
  list(schoolId?: string, studentId?: string) {
    return ENROLLMENT_FIXTURES.filter((item) => {
      if (schoolId && item.schoolId !== schoolId) {
        return false;
      }
      if (studentId && item.studentId !== studentId) {
        return false;
      }
      return true;
    });
  }

  getOverview() {
    return {
      totals: {
        enrollments: ENROLLMENT_FIXTURES.length,
        active: ENROLLMENT_FIXTURES.filter((item) => item.status === 'active').length,
        awaitingFeeAssignment: ENROLLMENT_FIXTURES.filter(
          (item) => item.status === 'awaiting_fee_assignment',
        ).length,
      },
      items: ENROLLMENT_FIXTURES,
    };
  }
}
