import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { SavingsService } from './savings.service';

describe('SavingsService', () => {
  let savingsAccountModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let transactionModel: {
    find: jest.Mock;
  };
  let service: SavingsService;

  beforeEach(() => {
    savingsAccountModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    transactionModel = {
      find: jest.fn(),
    };

    service = new SavingsService(
      savingsAccountModel as never,
      transactionModel as never,
    );
  });

  it('returns savings accounts for the current member', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };
    const accounts = [{ accountNumber: '10001' }];

    savingsAccountModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(accounts),
        }),
      }),
    });

    await expect(service.getMyAccounts(currentUser)).resolves.toEqual(accounts);
  });

  it('returns transaction history for an owned account', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    };
    const accountId = new Types.ObjectId().toString();
    const transactions = [{ transactionReference: 'TX-1' }];

    savingsAccountModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: accountId }),
      }),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(transactions),
          }),
        }),
      }),
    });

    await expect(
      service.getAccountTransactions(currentUser, accountId, { limit: 10 }),
    ).resolves.toEqual(transactions);
  });

  it('rejects account detail lookup for staff users', async () => {
    await expect(
      service.getAccountDetail(
        {
          sub: 'staff_1',
          role: UserRole.ADMIN,
        },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects transaction history for a missing account', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };

    savingsAccountModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.getAccountTransactions(currentUser, new Types.ObjectId().toString(), {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows staff to list accounts for a member', async () => {
    const accounts = [{ accountNumber: '10002' }];

    savingsAccountModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(accounts),
        }),
      }),
    });

    await expect(
      service.getMemberAccounts(
        {
          sub: 'staff_1',
          role: UserRole.BRANCH_MANAGER,
        },
        new Types.ObjectId().toString(),
      ),
    ).resolves.toEqual(accounts);
  });
});
