import { ForbiddenException } from '@nestjs/common';

import { PaymentType, UserRole } from '../../common/enums';
import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  let transactionModel: { find: jest.Mock };
  let autopaySettingModel: { find: jest.Mock };
  let schoolPaymentModel: { find: jest.Mock };
  let loanModel: { find: jest.Mock };
  let insurancePolicyModel: { find: jest.Mock };
  let savingsAccountModel: { find: jest.Mock };
  let service: InsightsService;

  beforeEach(() => {
    transactionModel = { find: jest.fn() };
    autopaySettingModel = { find: jest.fn() };
    schoolPaymentModel = { find: jest.fn() };
    loanModel = { find: jest.fn() };
    insurancePolicyModel = { find: jest.fn() };
    savingsAccountModel = { find: jest.fn() };

    for (const model of [
      transactionModel,
      autopaySettingModel,
      schoolPaymentModel,
      loanModel,
      insurancePolicyModel,
      savingsAccountModel,
    ]) {
      model.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });
    }

    service = new InsightsService(
      transactionModel as never,
      autopaySettingModel as never,
      schoolPaymentModel as never,
      loanModel as never,
      insurancePolicyModel as never,
      savingsAccountModel as never,
    );
  });

  it('prioritizes overdue and due insights for home', async () => {
    const now = new Date();

    schoolPaymentModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'school_1' },
          studentId: 'ST-1001',
          schoolName: 'Blue Nile Academy',
          amount: 5000,
          createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        },
      ]),
    });
    loanModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'loan_1' },
          loanType: 'Business Loan',
          amount: 120000,
          termMonths: 12,
          status: 'disbursed',
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        },
      ]),
    });
    insurancePolicyModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: { toString: () => 'policy_1' },
          policyNumber: 'POL-1001',
          providerName: 'Nyala Insurance',
          status: 'active',
          endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        },
      ]),
    });
    savingsAccountModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          balance: 1800,
        },
      ]),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          type: PaymentType.DEPOSIT,
          amount: 8000,
          createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        },
      ]),
    });

    const homeResult = await service.getMyHomeInsights({
      sub: '67f000000000000000000001',
      role: UserRole.MEMBER,
    } as never);
    const fullResult = await service.getMyInsights({
      sub: '67f000000000000000000001',
      role: UserRole.MEMBER,
    } as never);

    expect(homeResult.items).toHaveLength(3);
    expect(homeResult.items[0].type).toBe('payment_overdue');
    expect(homeResult.urgentCount).toBeGreaterThan(0);
    expect(fullResult.items.some((item) => item.type == 'insurance_due')).toBe(true);
  });

  it('returns a savings suggestion when no urgent items exist', async () => {
    const now = new Date();

    savingsAccountModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          balance: 45000,
        },
      ]),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          type: PaymentType.DEPOSIT,
          amount: 5000,
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          type: PaymentType.DEPOSIT,
          amount: 4000,
          createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        },
      ]),
    });

    const result = await service.getMyInsights({
      sub: '67f000000000000000000001',
      role: UserRole.MEMBER,
    } as never);

    expect(result.items[0].type).toBe('savings_suggestion');
    expect(result.items[0].actionLabel).toBe('Transfer Funds');
  });

  it('rejects staff access', async () => {
    await expect(
      service.getMyInsights({
        sub: 'staff_1',
        role: UserRole.BRANCH_MANAGER,
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
