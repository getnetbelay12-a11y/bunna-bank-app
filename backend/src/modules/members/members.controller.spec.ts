import { MembersController } from './members.controller';
import { MembersService } from './members.service';

describe('MembersController', () => {
  let controller: MembersController;
  let membersService: jest.Mocked<MembersService>;

  beforeEach(() => {
    membersService = {
      getMyProfile: jest.fn(),
      updateMyProfile: jest.fn(),
      getMemberById: jest.fn(),
      createMember: jest.fn(),
      listMembers: jest.fn(),
    } as unknown as jest.Mocked<MembersService>;

    controller = new MembersController(membersService);
  });

  it('delegates getMyProfile to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    membersService.getMyProfile.mockResolvedValue({ id: 'member_1' } as never);

    await controller.getMyProfile(currentUser);

    expect(membersService.getMyProfile).toHaveBeenCalledWith(currentUser);
  });

  it('delegates updateMyProfile to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const dto = { fullName: 'Updated Name' };

    await controller.updateMyProfile(currentUser, dto);

    expect(membersService.updateMyProfile).toHaveBeenCalledWith(currentUser, dto);
  });

  it('delegates getMemberById to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getMemberById(currentUser, 'member_1');

    expect(membersService.getMemberById).toHaveBeenCalledWith(
      currentUser,
      'member_1',
    );
  });

  it('delegates createMember to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const dto = { memberNumber: 'BUN-100003' } as never;

    await controller.createMember(currentUser, dto);

    expect(membersService.createMember).toHaveBeenCalledWith(currentUser, dto);
  });

  it('delegates listMembers to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;
    const query = { page: 1, limit: 20 } as never;

    await controller.listMembers(currentUser, query);

    expect(membersService.listMembers).toHaveBeenCalledWith(currentUser, query);
  });
});
