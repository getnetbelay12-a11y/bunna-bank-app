import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

const GUARDIAN_FIXTURES = [
  {
    guardianId: 'GDN-1001',
    studentId: 'ST-1001',
    fullName: 'Alemu Bekele',
    phone: '0911000006',
    relationship: 'father',
    status: 'linked',
  },
  {
    guardianId: 'GDN-1002',
    studentId: 'ST-1002',
    fullName: 'Tadesse Worku',
    phone: '0911000007',
    relationship: 'mother',
    status: 'linked',
  },
  {
    guardianId: 'GDN-2001',
    studentId: 'ST-2001',
    fullName: 'Kassahun Molla',
    phone: '0911000008',
    relationship: 'uncle',
    status: 'pending_verification',
  },
];

@Injectable()
export class GuardiansService {
  private readonly guardians = GUARDIAN_FIXTURES.map((item) => ({ ...item }));

  list(studentId?: string) {
    return this.guardians.filter((item) => !studentId || item.studentId === studentId);
  }

  getOverview() {
    return {
      totals: {
        guardians: this.guardians.length,
        linked: this.guardians.filter((item) => item.status === 'linked').length,
        pendingVerification: this.guardians.filter(
          (item) => item.status === 'pending_verification',
        ).length,
      },
      items: this.guardians,
    };
  }

  create(payload: CreateGuardianDto) {
    const guardian = {
      guardianId: `GDN-${String(this.guardians.length + 1001)}`,
      studentId: payload.studentId,
      fullName: payload.fullName,
      phone: payload.phone,
      relationship: payload.relationship,
      status: payload.status,
    };

    this.guardians.unshift(guardian);
    return guardian;
  }

  update(guardianId: string, payload: UpdateGuardianDto) {
    const guardian = this.guardians.find((item) => item.guardianId === guardianId);

    if (!guardian) {
      throw new NotFoundException(`Guardian ${guardianId} was not found.`);
    }

    Object.assign(guardian, payload);
    return guardian;
  }
}
