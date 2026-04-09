import { Injectable } from '@nestjs/common';

type StudentPerformanceProfile = {
  studentId: string;
  latestReportPeriod: string;
  latestAverage: number;
  attendanceRate: number;
  classRank: number;
  behavior: 'excellent' | 'good' | 'watch';
  teacherRemark: string;
  strengths: string[];
  improvementAreas: string[];
  updatedAt: string;
};

const STUDENT_PERFORMANCE_FIXTURES: StudentPerformanceProfile[] = [
  {
    studentId: 'ST-1001',
    latestReportPeriod: 'Term 2',
    latestAverage: 91,
    attendanceRate: 97,
    classRank: 3,
    behavior: 'excellent',
    teacherRemark: 'Consistently strong performance with excellent homework completion.',
    strengths: ['Mathematics', 'Reading comprehension'],
    improvementAreas: ['Keep practicing laboratory reports'],
    updatedAt: '2026-03-08T09:30:00.000Z',
  },
  {
    studentId: 'ST-1002',
    latestReportPeriod: 'Term 2',
    latestAverage: 88,
    attendanceRate: 94,
    classRank: 6,
    behavior: 'good',
    teacherRemark: 'Steady progress across core subjects and active class participation.',
    strengths: ['Biology', 'English'],
    improvementAreas: ['Weekly revision discipline'],
    updatedAt: '2026-03-09T10:15:00.000Z',
  },
  {
    studentId: 'ST-2001',
    latestReportPeriod: 'Term 2',
    latestAverage: 79,
    attendanceRate: 90,
    classRank: 12,
    behavior: 'watch',
    teacherRemark: 'Needs closer follow-up on assignments to improve term results.',
    strengths: ['Social studies', 'Class participation'],
    improvementAreas: ['Mathematics practice', 'Assignment completion'],
    updatedAt: '2026-03-10T11:20:00.000Z',
  },
];

@Injectable()
export class SchoolReportsService {
  getCollectionsSummary() {
    return {
      generatedAt: '2026-03-10T12:00:00.000Z',
      schools: 2,
      totalStudents: 2100,
      totalInvoices: 525,
      collectionsToday: 277700,
      arrearsAmount: 13200,
      settlementPendingAmount: 1200,
    };
  }

  getStudentPerformance(input: {
    studentId: string;
    fullName?: string;
    grade?: string;
  }) {
    const existing = STUDENT_PERFORMANCE_FIXTURES.find(
      (item) => item.studentId === input.studentId,
    );

    if (existing) {
      return existing;
    }

    const gradeNumber =
      Number.parseInt(input.grade?.replace(/[^\d]/g, '') ?? '', 10) || 6;
    const latestAverage = Math.max(72, Math.min(96, 84 + (gradeNumber % 5)));
    const attendanceRate = Math.max(88, Math.min(99, 92 + (gradeNumber % 4)));

    return {
      studentId: input.studentId,
      latestReportPeriod: 'Current term',
      latestAverage,
      attendanceRate,
      classRank: Math.max(2, gradeNumber + 1),
      behavior: latestAverage >= 88 ? 'excellent' : 'good',
      teacherRemark: input.fullName
        ? `${input.fullName} is on track this term. Share the latest grade and attendance report with the parent after payment confirmation.`
        : 'The student is on track this term. Share the latest grade and attendance report with the parent after payment confirmation.',
      strengths: ['Class participation', 'Attendance'],
      improvementAreas: ['Keep submission consistency'],
      updatedAt: new Date('2026-03-12T08:00:00.000Z').toISOString(),
    };
  }
}
