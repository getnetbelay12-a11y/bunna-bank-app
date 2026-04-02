import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { LoanAction, LoanStatus, LoanWorkflowLevel, UserRole } from '../../common/enums';
import { LoanWorkflowService } from './loan-workflow.service';

describe('LoanWorkflowService', () => {
  let loanModel: { findById: jest.Mock };
  let workflowHistoryModel: { create: jest.Mock };
  let staffActivityLogModel: { create: jest.Mock };
  let notificationModel: { create: jest.Mock };
  let auditService: { log: jest.Mock };
  let service: LoanWorkflowService;

  const buildLoan = ({
    amount = 1000,
    status = LoanStatus.SUBMITTED,
    currentLevel = LoanWorkflowLevel.BRANCH,
  } = {}) => {
    const loanId = new Types.ObjectId();
    return {
      _id: loanId,
      memberId: new Types.ObjectId(),
      branchId: new Types.ObjectId(),
      districtId: new Types.ObjectId(),
      amount,
      status,
      currentLevel,
      save: jest.fn().mockResolvedValue(undefined),
    };
  };

  beforeEach(() => {
    loanModel = { findById: jest.fn() };
    workflowHistoryModel = { create: jest.fn() };
    staffActivityLogModel = { create: jest.fn() };
    notificationModel = { create: jest.fn() };
    auditService = { log: jest.fn() };

    service = new LoanWorkflowService(
      loanModel as never,
      workflowHistoryModel as never,
      staffActivityLogModel as never,
      notificationModel as never,
      auditService as never,
    );
  });

  it('allows branch approval for loans at or below the threshold', async () => {
    const loan = buildLoan({ amount: 1_000_000, currentLevel: LoanWorkflowLevel.BRANCH });
    loanModel.findById.mockResolvedValue(loan);

    const result = await service.processAction(
      { sub: new Types.ObjectId().toString(), role: UserRole.BRANCH_MANAGER },
      loan._id.toString(),
      { action: LoanAction.APPROVE },
    );

    expect(result.status).toBe(LoanStatus.APPROVED);
    expect(workflowHistoryModel.create).toHaveBeenCalled();
    expect(staffActivityLogModel.create).toHaveBeenCalled();
    expect(notificationModel.create).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalled();
  });

  it('forces high-value branch loans to be forwarded instead of approved', async () => {
    const loan = buildLoan({ amount: 25_000_000, currentLevel: LoanWorkflowLevel.BRANCH });
    loanModel.findById.mockResolvedValue(loan);

    await expect(
      service.processAction(
        { sub: new Types.ObjectId().toString(), role: UserRole.BRANCH_MANAGER },
        loan._id.toString(),
        { action: LoanAction.APPROVE },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forwards a high-value loan from branch to district', async () => {
    const loan = buildLoan({ amount: 25_000_000, currentLevel: LoanWorkflowLevel.BRANCH });
    loanModel.findById.mockResolvedValue(loan);

    const result = await service.processAction(
      { sub: new Types.ObjectId().toString(), role: UserRole.LOAN_OFFICER },
      loan._id.toString(),
      { action: LoanAction.FORWARD },
    );

    expect(result.status).toBe(LoanStatus.DISTRICT_REVIEW);
    expect(result.currentLevel).toBe(LoanWorkflowLevel.DISTRICT);
  });

  it('prevents approve after reject', async () => {
    const loan = buildLoan({ status: LoanStatus.REJECTED });
    loanModel.findById.mockResolvedValue(loan);

    await expect(
      service.processAction(
        { sub: new Types.ObjectId().toString(), role: UserRole.BRANCH_MANAGER },
        loan._id.toString(),
        { action: LoanAction.APPROVE },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents disbursement before approval', async () => {
    const loan = buildLoan({ status: LoanStatus.BRANCH_REVIEW });
    loanModel.findById.mockResolvedValue(loan);

    await expect(
      service.processAction(
        { sub: new Types.ObjectId().toString(), role: UserRole.BRANCH_MANAGER },
        loan._id.toString(),
        { action: LoanAction.DISBURSE },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects member users from workflow actions', async () => {
    await expect(
      service.processAction(
        { sub: 'member_1', role: UserRole.MEMBER },
        new Types.ObjectId().toString(),
        { action: LoanAction.REVIEW },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('raises not found for missing loans', async () => {
    loanModel.findById.mockResolvedValue(null);

    await expect(
      service.processAction(
        { sub: new Types.ObjectId().toString(), role: UserRole.ADMIN },
        new Types.ObjectId().toString(),
        { action: LoanAction.REVIEW },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
