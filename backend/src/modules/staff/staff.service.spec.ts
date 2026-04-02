import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { StaffService } from './staff.service';

describe('StaffService', () => {
  let staffModel: { find: jest.Mock; findOne: jest.Mock };
  let service: StaffService;

  beforeEach(() => {
    staffModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    service = new StaffService(staffModel as never);
  });

  it('returns the current staff profile', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.ADMIN,
    };
    const profile = { _id: currentUser.sub, fullName: 'Admin User' };

    staffModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(profile),
      }),
    });

    await expect(service.getMyProfile(currentUser)).resolves.toEqual(profile);
  });

  it('lists branch-scoped staff for a branch manager', async () => {
    const branchId = new Types.ObjectId().toString();
    const currentUser: AuthenticatedUser = {
      sub: 'staff_1',
      role: UserRole.BRANCH_MANAGER,
      branchId,
      districtId: new Types.ObjectId().toString(),
    };
    const staff = [{ fullName: 'Loan Officer One' }];

    staffModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(staff),
        }),
      }),
    });

    await expect(service.listStaff(currentUser, {})).resolves.toEqual(staff);
  });

  it('rejects a branch manager querying another branch explicitly', async () => {
    await expect(
      service.getBranchStaff(
        {
          sub: 'staff_1',
          role: UserRole.BRANCH_MANAGER,
          branchId: new Types.ObjectId().toString(),
        },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects member users from staff endpoints', async () => {
    await expect(
      service.getMyProfile({
        sub: 'member_1',
        role: UserRole.MEMBER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when the requested staff record is not visible', async () => {
    staffModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getStaffById(
        {
          sub: 'staff_1',
          role: UserRole.DISTRICT_MANAGER,
          districtId: new Types.ObjectId().toString(),
        },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
