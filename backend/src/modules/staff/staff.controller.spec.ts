import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

describe('StaffController', () => {
  let controller: StaffController;
  let staffService: jest.Mocked<StaffService>;

  beforeEach(() => {
    staffService = {
      getMyProfile: jest.fn(),
      listStaff: jest.fn(),
      getBranchStaff: jest.fn(),
      getDistrictStaff: jest.fn(),
      getStaffById: jest.fn(),
    } as unknown as jest.Mocked<StaffService>;

    controller = new StaffController(staffService);
  });

  it('delegates getMyProfile to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getMyProfile(currentUser);

    expect(staffService.getMyProfile).toHaveBeenCalledWith(currentUser);
  });

  it('delegates listStaff to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { role: 'loan_officer' } as never;

    await controller.listStaff(currentUser, query);

    expect(staffService.listStaff).toHaveBeenCalledWith(currentUser, query);
  });

  it('delegates getBranchStaff to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getBranchStaff(currentUser, 'branch_1');

    expect(staffService.getBranchStaff).toHaveBeenCalledWith(
      currentUser,
      'branch_1',
    );
  });

  it('delegates getDistrictStaff to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getDistrictStaff(currentUser, 'district_1');

    expect(staffService.getDistrictStaff).toHaveBeenCalledWith(
      currentUser,
      'district_1',
    );
  });

  it('delegates getStaffById to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getStaffById(currentUser, 'staff_2');

    expect(staffService.getStaffById).toHaveBeenCalledWith(
      currentUser,
      'staff_2',
    );
  });
});
