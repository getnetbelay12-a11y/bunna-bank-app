import { Injectable } from '@nestjs/common';

import { CreateFeePlanDto } from './dto/create-fee-plan.dto';

const FEE_PLAN_FIXTURES = [
  {
    id: 'fp_2026_blue_nile_g7',
    schoolId: 'school_blue_nile',
    schoolName: 'Blue Nile Academy',
    academicYear: '2026',
    term: 'Term 1',
    grade: 'Grade 7',
    name: 'Grade 7 Standard Plan',
    status: 'active',
    items: [
      { label: 'Tuition', amount: 8000 },
      { label: 'Transport', amount: 1500 },
    ],
    total: 9500,
  },
  {
    id: 'fp_2026_tana_g5',
    schoolId: 'school_tana',
    schoolName: 'Lake Tana Preparatory School',
    academicYear: '2026',
    term: 'Term 1',
    grade: 'Grade 5',
    name: 'Grade 5 Standard Plan',
    status: 'draft',
    items: [
      { label: 'Tuition', amount: 6200 },
      { label: 'Materials', amount: 1000 },
    ],
    total: 7200,
  },
];

@Injectable()
export class FeePlansService {
  private readonly plans = FEE_PLAN_FIXTURES.map((item) => ({ ...item }));

  list(schoolId?: string) {
    return this.plans.filter((item) => !schoolId || item.schoolId === schoolId);
  }

  getOverview() {
    return {
      totals: {
        plans: this.plans.length,
        active: this.plans.filter((item) => item.status === 'active').length,
        draft: this.plans.filter((item) => item.status === 'draft').length,
      },
      items: this.plans,
    };
  }

  create(payload: CreateFeePlanDto) {
    const total = payload.items.reduce((sum, item) => sum + item.amount, 0);
    const created = {
      id: `fp_${payload.academicYear}_${payload.schoolId}_${Date.now()}`,
      schoolId: payload.schoolId,
      schoolName: payload.schoolName,
      academicYear: payload.academicYear,
      term: payload.term,
      grade: payload.grade,
      name: payload.name,
      status: payload.status,
      items: payload.items,
      total,
    };

    this.plans.unshift(created);
    return created;
  }

  findApplicablePlan(payload: {
    schoolId: string;
    academicYear?: string;
    term?: string;
    grade?: string;
  }) {
    return this.plans.find((item) => {
      if (item.schoolId !== payload.schoolId) {
        return false;
      }
      if (payload.academicYear && item.academicYear !== payload.academicYear) {
        return false;
      }
      if (payload.term && item.term !== payload.term) {
        return false;
      }
      if (payload.grade && item.grade !== payload.grade) {
        return false;
      }

      return item.status === 'active';
    });
  }
}
