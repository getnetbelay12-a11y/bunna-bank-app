import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Staff, StaffDocument } from '../../staff/schemas/staff.schema';
import { AuthPrincipal } from '../interfaces';
import { StaffAuthRepository } from '../auth.types';

@Injectable()
export class MongooseStaffAuthRepository implements StaffAuthRepository {
  constructor(
    @InjectModel(Staff.name)
    private readonly staffModel: Model<StaffDocument>,
  ) {}

  async findByIdentifier(identifier: string): Promise<AuthPrincipal | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const aliasTargets = this.resolveDemoAliases(normalizedIdentifier);
    if (aliasTargets.length > 0) {
      const aliasedStaff = await this.findFirstMatchingStaff(aliasTargets);
      if (aliasedStaff) {
        return aliasedStaff;
      }
    }

    const lookupValues = Array.from(new Set([identifier.trim(), normalizedIdentifier]));
    return this.findFirstMatchingStaff(lookupValues, identifier.trim());
  }

  private async findFirstMatchingStaff(
    lookupValues: string[],
    staffNumber?: string,
  ): Promise<AuthPrincipal | null> {
    const staff = await this.staffModel
      .findOne({
        isActive: true,
        $or: [
          { identifier: { $in: lookupValues } },
          { email: { $in: lookupValues } },
          ...(staffNumber ? [{ staffNumber }] : []),
        ],
      })
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'districtId', select: 'name' })
      .lean<
        | ({
            _id: { toString(): string };
            role: AuthPrincipal['role'];
            passwordHash: string;
            fullName: string;
            staffNumber: string;
            phone: string;
            identifier?: string;
            email?: string;
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
      branchId: branch.id,
      districtId: district.id,
      branchName: branch.name,
      districtName: district.name,
    };
  }

  private resolveDemoAliases(identifier: string): string[] {
    const headOfficeAliases = new Set([
      'admin',
      'head_office',
      'head-office',
      'head office',
      'headoffice',
    ]);

    if (!headOfficeAliases.has(identifier)) {
      return [];
    }

    return ['admin@bunna.local'];
  }
}
