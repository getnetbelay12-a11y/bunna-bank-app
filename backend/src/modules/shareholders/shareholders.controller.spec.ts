import { ShareholdersController } from './shareholders.controller';
import { ShareholdersService } from './shareholders.service';

describe('ShareholdersController', () => {
  let controller: ShareholdersController;
  let shareholdersService: jest.Mocked<ShareholdersService>;

  beforeEach(() => {
    shareholdersService = {
      getMyShareholderProfile: jest.fn(),
      getMyVotingEligibility: jest.fn(),
      getShareholderById: jest.fn(),
      getVotingEligibilityByMemberId: jest.fn(),
    } as unknown as jest.Mocked<ShareholdersService>;

    controller = new ShareholdersController(shareholdersService);
  });

  it('delegates getMyShareholderProfile to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'shareholder_member' } as never;

    await controller.getMyShareholderProfile(currentUser);

    expect(shareholdersService.getMyShareholderProfile).toHaveBeenCalledWith(
      currentUser,
    );
  });

  it('delegates getMyVotingEligibility to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'shareholder_member' } as never;

    await controller.getMyVotingEligibility(currentUser);

    expect(shareholdersService.getMyVotingEligibility).toHaveBeenCalledWith(
      currentUser,
    );
  });

  it('delegates getShareholderById to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getShareholderById(currentUser, 'member_1');

    expect(shareholdersService.getShareholderById).toHaveBeenCalledWith(
      currentUser,
      'member_1',
    );
  });

  it('delegates getVotingEligibilityByMemberId to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getVotingEligibilityByMemberId(currentUser, 'member_1');

    expect(
      shareholdersService.getVotingEligibilityByMemberId,
    ).toHaveBeenCalledWith(currentUser, 'member_1');
  });
});
