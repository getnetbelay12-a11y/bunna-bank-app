import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { LoansService } from './loans.service';

describe('LoansService', () => {
  let loanModel: { create: jest.Mock; find: jest.Mock; findById: jest.Mock };
  let loanDocumentModel: { create: jest.Mock };
  let workflowHistoryModel: { create: jest.Mock };
  let notificationModel: { create: jest.Mock };
  let memberModel: { findById: jest.Mock };
  let auditService: { log: jest.Mock };
  let storageService: { registerDocument: jest.Mock };
  let service: LoansService;

  beforeEach(() => {
    loanModel = { create: jest.fn(), find: jest.fn(), findById: jest.fn() };
    loanDocumentModel = { create: jest.fn() };
    workflowHistoryModel = { create: jest.fn() };
    notificationModel = { create: jest.fn() };
    memberModel = { findById: jest.fn() };
    auditService = { log: jest.fn() };
    storageService = { registerDocument: jest.fn() };

    service = new LoansService(
      loanModel as never,
      loanDocumentModel as never,
      workflowHistoryModel as never,
      notificationModel as never,
      memberModel as never,
      auditService as never,
      storageService as never,
    );
  });

  it('submits a loan and creates workflow, notification, and audit records', async () => {
    const memberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    const loanId = new Types.ObjectId();
    const documentId = new Types.ObjectId();
    const currentUser: AuthenticatedUser = {
      sub: memberId.toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        branchId,
        districtId,
      }),
    });
    loanModel.create.mockResolvedValue({
      _id: loanId,
      memberId,
      branchId,
      districtId,
      loanType: 'business',
      amount: 500000,
      interestRate: 12,
      termMonths: 24,
      purpose: 'Working capital',
      status: 'submitted',
      currentLevel: 'branch',
      assignedToStaffId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    loanDocumentModel.create.mockResolvedValue([{ _id: documentId }]);
    storageService.registerDocument.mockResolvedValue({
      provider: 'local',
      storageKey: 'loans/loan_1/123-id.pdf.json',
    });

    const result = await service.submitLoanApplication(currentUser, {
      loanType: 'business',
      amount: 500000,
      interestRate: 12,
      termMonths: 24,
      purpose: 'Working capital',
      documents: [
        {
          documentType: 'id_card',
          originalFileName: 'id.pdf',
        },
      ],
    });

    expect(loanModel.create).toHaveBeenCalled();
    expect(storageService.registerDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'loans',
        entityId: loanId.toString(),
        originalFileName: 'id.pdf',
      }),
    );
    expect(workflowHistoryModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId,
        action: 'submit',
        toStatus: 'submitted',
      }),
    );
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'loan_status',
        entityType: 'loan',
        entityId: loanId,
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'loan_submitted',
        entityId: loanId.toString(),
      }),
    );
    expect(result.documentIds).toEqual([documentId.toString()]);
  });

  it('rejects staff users from loan submission', async () => {
    await expect(
      service.submitLoanApplication(
        { sub: 'staff_1', role: UserRole.ADMIN },
        {
          loanType: 'business',
          amount: 1,
          interestRate: 1,
          termMonths: 1,
          purpose: 'x',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns only the current member loans', async () => {
    const memberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    loanModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            branchId,
            districtId,
            loanType: 'business',
            amount: 1000,
            interestRate: 10,
            termMonths: 12,
            purpose: 'capital',
            status: 'submitted',
            currentLevel: 'branch',
          },
        ]),
      }),
    });

    const result = await service.getMyLoans({
      sub: memberId.toString(),
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    });

    expect(result).toHaveLength(1);
    expect(loanModel.find).toHaveBeenCalledWith({ memberId: expect.any(Types.ObjectId) });
  });

  it('raises not found when a member requests a missing loan', async () => {
    loanModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.getLoanDetail(
        { sub: new Types.ObjectId().toString(), role: UserRole.MEMBER },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses a provided storage key without calling storage service', async () => {
    const memberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    const loanId = new Types.ObjectId();

    loanModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: loanId,
        memberId,
        branchId,
        districtId,
      }),
    });
    loanDocumentModel.create.mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        documentType: 'collateral',
        originalFileName: 'house-title.pdf',
        storageKey: 'manual/key.pdf',
      },
    ]);

    const result = await service.attachLoanDocument(
      { sub: memberId.toString(), role: UserRole.MEMBER },
      loanId.toString(),
      {
        documentType: 'collateral',
        originalFileName: 'house-title.pdf',
        storageKey: 'manual/key.pdf',
      },
    );

    expect(storageService.registerDocument).not.toHaveBeenCalled();
    expect(result.storageKey).toBe('manual/key.pdf');
  });

  it('rejects oversized loan documents before storage', async () => {
    const memberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    const loanId = new Types.ObjectId();

    loanModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: loanId,
        memberId,
        branchId,
        districtId,
      }),
    });

    await expect(
      service.attachLoanDocument(
        { sub: memberId.toString(), role: UserRole.MEMBER },
        loanId.toString(),
        {
          documentType: 'collateral',
          originalFileName: 'large.pdf',
          sizeBytes: 30 * 1024 * 1024,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.registerDocument).not.toHaveBeenCalled();
  });

  it('rejects storage keys with path traversal segments', async () => {
    const memberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    const loanId = new Types.ObjectId();

    loanModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: loanId,
        memberId,
        branchId,
        districtId,
      }),
    });

    await expect(
      service.attachLoanDocument(
        { sub: memberId.toString(), role: UserRole.MEMBER },
        loanId.toString(),
        {
          documentType: 'collateral',
          originalFileName: 'house-title.pdf',
          storageKey: '../manual/key.pdf',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
