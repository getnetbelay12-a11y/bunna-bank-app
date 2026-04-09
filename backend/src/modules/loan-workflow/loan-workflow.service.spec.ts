import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { LoanAction, LoanStatus, LoanWorkflowLevel, UserRole } from '../../common/enums';
import { LoanWorkflowService } from './loan-workflow.service';

describe('LoanWorkflowService', () => {
  let loanModel: { findById: jest.Mock };
  let memberModel: { aggregate: jest.Mock };
  let transactionModel: { aggregate: jest.Mock };
  let autopaySettingModel: { find: jest.Mock };
  let chatConversationModel: { aggregate: jest.Mock };
  let workflowHistoryModel: { create: jest.Mock };
  let staffActivityLogModel: { create: jest.Mock };
  let notificationsService: { createNotification: jest.Mock };
  let auditService: { logActorAction: jest.Mock };
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
    memberModel = { aggregate: jest.fn() };
    transactionModel = { aggregate: jest.fn() };
    autopaySettingModel = { find: jest.fn() };
    chatConversationModel = { aggregate: jest.fn() };
    workflowHistoryModel = { create: jest.fn() };
    staffActivityLogModel = { create: jest.fn() };
    notificationsService = { createNotification: jest.fn() };
    auditService = { logActorAction: jest.fn() };

    service = new LoanWorkflowService(
      loanModel as never,
      memberModel as never,
      transactionModel as never,
      autopaySettingModel as never,
      chatConversationModel as never,
      workflowHistoryModel as never,
      staffActivityLogModel as never,
      auditService as never,
      notificationsService as never,
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
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: loan.memberId.toString(),
        entityType: 'loan',
        entityId: loan._id.toString(),
        actionLabel: 'Open loan',
        priority: 'normal',
        deepLink: `/loans/${loan._id.toString()}`,
      }),
    );
    expect(auditService.logActorAction).toHaveBeenCalled();
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

  it('marks return-for-correction notifications as high priority', async () => {
    const loan = buildLoan({
      amount: 850_000,
      status: LoanStatus.BRANCH_REVIEW,
      currentLevel: LoanWorkflowLevel.BRANCH,
    });
    loanModel.findById.mockResolvedValue(loan);

    const result = await service.processAction(
      { sub: new Types.ObjectId().toString(), role: UserRole.LOAN_OFFICER },
      loan._id.toString(),
      {
        action: LoanAction.RETURN_FOR_CORRECTION,
        comment: 'Upload clearer collateral file.',
        deficiencyReasons: ['Upload clearer collateral file.'],
      },
    );

    expect(result.status).toBe(LoanStatus.SUBMITTED);
    expect(result.currentLevel).toBe(LoanWorkflowLevel.BRANCH);
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: loan.memberId.toString(),
        entityId: loan._id.toString(),
        actionLabel: 'Open loan',
        priority: 'high',
        deepLink: `/loans/${loan._id.toString()}`,
      }),
    );
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
