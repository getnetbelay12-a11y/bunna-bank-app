import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let transactionModel: { create: jest.Mock };
  let schoolPaymentModel: { create: jest.Mock; find: jest.Mock; aggregate: jest.Mock };
  let notificationModel: { create: jest.Mock };
  let savingsAccountModel: { findById: jest.Mock };
  let paymentNotificationPort: { dispatch: jest.Mock };
  let auditService: { log: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    transactionModel = { create: jest.fn() };
    schoolPaymentModel = {
      create: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
    };
    notificationModel = { create: jest.fn() };
    savingsAccountModel = { findById: jest.fn() };
    paymentNotificationPort = { dispatch: jest.fn() };
    auditService = { log: jest.fn() };

    service = new PaymentsService(
      transactionModel as never,
      schoolPaymentModel as never,
      notificationModel as never,
      savingsAccountModel as never,
      paymentNotificationPort,
      auditService as never,
    );
  });

  it('creates a school payment, transaction, and notification', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.SHAREHOLDER_MEMBER,
      memberType: MemberType.SHAREHOLDER,
    };
    const accountId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const schoolPaymentId = new Types.ObjectId();

    savingsAccountModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: accountId,
        memberId: new Types.ObjectId(currentUser.sub),
        branchId,
        currency: 'ETB',
      }),
    });
    schoolPaymentModel.create.mockResolvedValue({ _id: schoolPaymentId });
    paymentNotificationPort.dispatch.mockResolvedValue('sent');

    const result = await service.createSchoolPayment(currentUser, {
      accountId: accountId.toString(),
      studentId: 'ST-1001',
      schoolName: 'Blue Nile Academy',
      amount: 1500,
      channel: 'mobile',
      narration: 'Term 1 fee',
    });

    expect(transactionModel.create).toHaveBeenCalled();
    expect(schoolPaymentModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: expect.any(Types.ObjectId),
        studentId: 'ST-1001',
        schoolName: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
        status: 'successful',
      }),
    );
    expect(notificationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment',
        status: 'sent',
        entityType: 'school_payment',
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'school_payment_created',
        entityType: 'school_payment',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        schoolPaymentId: schoolPaymentId.toString(),
        notificationStatus: 'sent',
      }),
    );
  });

  it('rejects school payment creation for staff users', async () => {
    await expect(
      service.createSchoolPayment(
        {
          sub: 'staff_1',
          role: UserRole.BRANCH_MANAGER,
        },
        {
          accountId: new Types.ObjectId().toString(),
          studentId: 'ST-1',
          schoolName: 'School',
          amount: 100,
          channel: 'branch',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the account does not belong to the member', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };

    savingsAccountModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.createSchoolPayment(currentUser, {
        accountId: new Types.ObjectId().toString(),
        studentId: 'ST-1001',
        schoolName: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns aggregate summary data for staff dashboard usage', async () => {
    schoolPaymentModel.aggregate.mockResolvedValue([
      {
        totalPayments: 8,
        totalAmount: 12000,
        mobilePayments: 5,
        branchPayments: 3,
      },
    ]);

    await expect(
      service.getSchoolPaymentSummary(
        {
          sub: 'staff_1',
          role: UserRole.ADMIN,
        },
        {},
      ),
    ).resolves.toEqual({
      totalPayments: 8,
      totalAmount: 12000,
      mobilePayments: 5,
      branchPayments: 3,
    });
  });
});
