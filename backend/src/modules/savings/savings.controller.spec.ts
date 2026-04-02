import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';

describe('SavingsController', () => {
  let controller: SavingsController;
  let savingsService: jest.Mocked<SavingsService>;

  beforeEach(() => {
    savingsService = {
      getMyAccounts: jest.fn(),
      getAccountDetail: jest.fn(),
      getAccountTransactions: jest.fn(),
      getMemberAccounts: jest.fn(),
    } as unknown as jest.Mocked<SavingsService>;

    controller = new SavingsController(savingsService);
  });

  it('delegates getMyAccounts to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getMyAccounts(currentUser);

    expect(savingsService.getMyAccounts).toHaveBeenCalledWith(currentUser);
  });

  it('delegates getAccountDetail to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;

    await controller.getAccountDetail(currentUser, 'account_1');

    expect(savingsService.getAccountDetail).toHaveBeenCalledWith(
      currentUser,
      'account_1',
    );
  });

  it('delegates getAccountTransactions to the service', async () => {
    const currentUser = { sub: 'member_1', role: 'member' } as never;
    const query = { limit: 25 };

    await controller.getAccountTransactions(currentUser, 'account_1', query);

    expect(savingsService.getAccountTransactions).toHaveBeenCalledWith(
      currentUser,
      'account_1',
      query,
    );
  });

  it('delegates getMemberAccounts to the service', async () => {
    const currentUser = { sub: 'staff_1', role: 'admin' } as never;

    await controller.getMemberAccounts(currentUser, 'member_1');

    expect(savingsService.getMemberAccounts).toHaveBeenCalledWith(
      currentUser,
      'member_1',
    );
  });
});
