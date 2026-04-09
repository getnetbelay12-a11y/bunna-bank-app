import { Injectable } from '@nestjs/common';

import { CreateSchoolDto } from './dto/create-school.dto';

type SchoolSummary = {
  id: string;
  code: string;
  name: string;
  branchName: string;
  city: string;
  region: string;
  status: string;
  students: number;
  openInvoices: number;
  todayCollections: number;
};

const SCHOOL_FIXTURES: SchoolSummary[] = [
  {
    id: 'school_blue_nile',
    code: 'SCH-1001',
    name: 'Blue Nile Academy',
    branchName: 'Bahir Dar Branch',
    city: 'Bahir Dar',
    region: 'National',
    status: 'active',
    students: 1240,
    openInvoices: 318,
    todayCollections: 184500,
  },
  {
    id: 'school_tana',
    code: 'SCH-1002',
    name: 'Lake Tana Preparatory School',
    branchName: 'Gondar Branch',
    city: 'Gondar',
    region: 'National',
    status: 'onboarding',
    students: 860,
    openInvoices: 207,
    todayCollections: 93200,
  },
];

@Injectable()
export class InstitutionsService {
  private readonly schools = [...SCHOOL_FIXTURES];

  getSchools() {
    return this.schools;
  }

  getOverview() {
    const activeSchools = this.schools.filter((item) => item.status === 'active').length;
    const onboardingSchools = this.schools.filter(
      (item) => item.status === 'onboarding',
    ).length;

    return {
      totals: {
        schools: this.schools.length,
        activeSchools,
        onboardingSchools,
        students: this.schools.reduce((sum, item) => sum + item.students, 0),
        openInvoices: this.schools.reduce((sum, item) => sum + item.openInvoices, 0),
        todayCollections: this.schools.reduce(
          (sum, item) => sum + item.todayCollections,
          0,
        ),
      },
      schools: this.schools,
    };
  }

  createSchool(payload: CreateSchoolDto) {
    const item: SchoolSummary = {
      id: `school_${payload.code.toLowerCase()}`,
      code: payload.code,
      name: payload.name,
      branchName: payload.branchName ?? 'Unassigned Branch',
      city: payload.city ?? 'Bahir Dar',
      region: payload.region ?? 'National',
      status: 'onboarding',
      students: 0,
      openInvoices: 0,
      todayCollections: 0,
    };

    this.schools.unshift(item);
    return item;
  }
}
