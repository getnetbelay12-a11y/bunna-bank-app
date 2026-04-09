import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRole } from '../../../common/enums';
import { Staff, StaffDocument } from '../../staff/schemas/staff.schema';
import { deriveStaffPermissions } from '../../staff/staff-permissions';
import { AuthPrincipal } from '../interfaces';
import { StaffAuthRepository } from '../auth.types';

const DEMO_SCHOOL_IDENTIFIER = 'admin@bluenileacademy.school';

@Injectable()
export class MongooseStaffAuthRepository implements StaffAuthRepository {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async findByIdentifier(identifier: string): Promise<AuthPrincipal | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (normalizedIdentifier === DEMO_SCHOOL_IDENTIFIER) {
      return {
        id: 'school_admin_blue_nile',
        role: UserRole.SCHOOL_ADMIN,
        passwordHash: 'demo-pass',
        identifier: DEMO_SCHOOL_IDENTIFIER,
        email: DEMO_SCHOOL_IDENTIFIER,
        fullName: 'Meron Fenta',
        staffNumber: 'SCH-0001',
        phone: '0911223344',
        schoolId: 'school_blue_nile',
        schoolName: 'Blue Nile Academy',
        branchName: 'Bahir Dar Branch',
        permissions: deriveStaffPermissions(UserRole.SCHOOL_ADMIN),
      };
    }

    const staff = await this.staffModel
      .findOne({ identifier, isActive: true })
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<
        | ({
            _id: { toString(): string };
            role: AuthPrincipal['role'];
            passwordHash: string;
            fullName: string;
            identifier: string;
            email?: string;
            staffNumber: string;
            phone: string;
            permissions?: string[];
            branchId?: { _id?: { toString(): string }; name?: string } | string;
            districtId?: { _id?: { toString(): string }; name?: string } | string;
          } & Record<string, unknown>)
        | null
      >();

    if (!staff) {
      return null;
    }

    const branch =
      typeof staff.branchId === 'string'
        ? { id: staff.branchId, name: undefined }
        : {
            id:
              staff.branchId?._id?.toString?.() ??
              (staff.branchId as unknown as { toString(): string } | undefined)
                  ?.toString?.(),
            name: staff.branchId?.name,
          };
    const district =
      typeof staff.districtId === 'string'
        ? { id: staff.districtId, name: undefined }
        : {
            id:
              staff.districtId?._id?.toString?.() ??
              (staff.districtId as unknown as { toString(): string } | undefined)
                  ?.toString?.(),
            name: staff.districtId?.name,
          };

    return {
      id: staff._id.toString(),
      role: staff.role,
      passwordHash: staff.passwordHash,
      identifier: staff.identifier,
      email: staff.email,
      fullName: staff.fullName,
      staffNumber: staff.staffNumber,
      phone: staff.phone,
      schoolId: undefined,
      schoolName: undefined,
      branchId: branch.id,
      districtId: district.id,
      branchName: branch.name,
      districtName: district.name,
      permissions:
        staff.permissions?.length != null && staff.permissions.length > 0
          ? staff.permissions
          : deriveStaffPermissions(staff.role),
    };
  }
}
