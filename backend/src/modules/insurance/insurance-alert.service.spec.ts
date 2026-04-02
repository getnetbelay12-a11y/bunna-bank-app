import { Types } from 'mongoose';

import { LoanStatus, UserRole } from '../../common/enums';
import { InsuranceAlertService } from './insurance-alert.service';

describe('InsuranceAlertService', () => {
  let loanModel: { find: jest.Mock };
  let memberModel: { find: jest.Mock };
  let insurancePolicyModel: { find: jest.Mock };
  let loanInsuranceLinkModel: { find: jest.Mock };
  let service: InsuranceAlertService;

  beforeEach(() => {
    loanModel = { find: jest.fn() };
    memberModel = { find: jest.fn() };
    insurancePolicyModel = { find: jest.fn() };
    loanInsuranceLinkModel = { find: jest.fn() };

    service = new InsuranceAlertService(
      loanModel as never,
      memberModel as never,
      insurancePolicyModel as never,
      loanInsuranceLinkModel as never,
    );
  });

  it('detects insurance expiring within reminder windows', async () => {
    const loanId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const policyId = new Types.ObjectId();
    loanModel.find.mockResolvedValue([
      {
        _id: loanId,
        memberId,
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
        status: LoanStatus.APPROVED,
      },
    ]);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        customerId: 'AMB-000001',
        fullName: 'Abebe Kebede',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      },
    ]);
    loanInsuranceLinkModel.find.mockResolvedValue([
      {
        loanId,
        insurancePolicyId: policyId,
      },
    ]);
    insurancePolicyModel.find.mockResolvedValue([
      {
        _id: policyId,
        linkedLoanId: loanId,
        policyNumber: 'POL-1',
        providerName: 'Nyala',
        insuranceType: 'asset',
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    const result = await service.getAlerts({
      sub: new Types.ObjectId().toString(),
      role: UserRole.HEAD_OFFICE_MANAGER,
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alertType: 'expiring_7_days' }),
      ]),
    );
  });

  it('detects loans with expired insurance and missing valid coverage', async () => {
    const loanId = new Types.ObjectId();
    const memberId = new Types.ObjectId();
    const policyId = new Types.ObjectId();
    loanModel.find.mockResolvedValue([
      {
        _id: loanId,
        memberId,
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
        status: LoanStatus.DISBURSED,
      },
    ]);
    memberModel.find.mockResolvedValue([
      {
        _id: memberId,
        customerId: 'AMB-000002',
        fullName: 'Mekdes Ali',
        branchId: new Types.ObjectId(),
        districtId: new Types.ObjectId(),
      },
    ]);
    loanInsuranceLinkModel.find.mockResolvedValue([
      {
        loanId,
        insurancePolicyId: policyId,
      },
    ]);
    insurancePolicyModel.find.mockResolvedValue([
      {
        _id: policyId,
        linkedLoanId: loanId,
        policyNumber: 'POL-2',
        providerName: 'Ethio Insurance',
        insuranceType: 'collateral',
        endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    const result = await service.getAlerts({
      sub: new Types.ObjectId().toString(),
      role: UserRole.HEAD_OFFICE_MANAGER,
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alertType: 'expired' }),
        expect.objectContaining({ alertType: 'loan_without_valid_insurance' }),
      ]),
    );
  });
});
