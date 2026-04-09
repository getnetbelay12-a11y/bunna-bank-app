import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { MemberType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let transactionModel: { create: jest.Mock; find: jest.Mock };
  let schoolPaymentModel: { create: jest.Mock; find: jest.Mock; aggregate: jest.Mock };
  let notificationsService: { createNotification: jest.Mock };
  let savingsAccountModel: { findById: jest.Mock; findOneAndUpdate: jest.Mock };
  let memberModel: { findById: jest.Mock; find: jest.Mock };
  let serviceRequestModel: { find: jest.Mock };
  let securityModel: { findOne: jest.Mock };
  let paymentNotificationPort: { dispatch: jest.Mock };
  let auditService: { logActorAction: jest.Mock };
  let schoolPaymentsService: { recordMemberPayment: jest.Mock };
  let studentsService: { list: jest.Mock };
  let schoolReportsService: { getStudentPerformance: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    transactionModel = { create: jest.fn(), find: jest.fn() };
    schoolPaymentModel = {
      create: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
    };
    notificationsService = { createNotification: jest.fn() };
    savingsAccountModel = { findById: jest.fn(), findOneAndUpdate: jest.fn() };
    memberModel = { findById: jest.fn(), find: jest.fn() };
    serviceRequestModel = { find: jest.fn() };
    securityModel = { findOne: jest.fn() };
    paymentNotificationPort = { dispatch: jest.fn() };
    auditService = { logActorAction: jest.fn() };
    schoolPaymentsService = { recordMemberPayment: jest.fn() };
    studentsService = { list: jest.fn() };
    schoolReportsService = { getStudentPerformance: jest.fn() };

    service = new PaymentsService(
      transactionModel as never,
      schoolPaymentModel as never,
      savingsAccountModel as never,
      memberModel as never,
      serviceRequestModel as never,
      securityModel as never,
      paymentNotificationPort,
      auditService as never,
      notificationsService as never,
      schoolPaymentsService as never,
      studentsService as never,
      schoolReportsService as never,
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

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(currentUser.sub),
        isActive: true,
        kycStatus: 'verified',
      }),
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    savingsAccountModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: accountId,
        memberId: new Types.ObjectId(currentUser.sub),
        branchId,
        balance: 4000,
        currency: 'ETB',
        isActive: true,
      }),
    });
    savingsAccountModel.findOneAndUpdate.mockResolvedValue({
      _id: accountId,
      memberId: new Types.ObjectId(currentUser.sub),
      branchId,
      balance: 2500,
      currency: 'ETB',
      isActive: true,
    });
    schoolPaymentModel.create.mockResolvedValue({ _id: schoolPaymentId });
    schoolPaymentsService.recordMemberPayment.mockReturnValue({
      receiptNo: 'RCP-2026-9999',
      invoiceNo: 'INV-2026-0001',
      remainingBalance: 0,
    });
    studentsService.list.mockReturnValue([
      {
        studentId: 'ST-1001',
        fullName: 'Bethel Alemu',
        grade: 'Grade 7',
      },
    ]);
    schoolReportsService.getStudentPerformance.mockReturnValue({
      latestAverage: 91,
      attendanceRate: 97,
    });
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
    expect(schoolPaymentsService.recordMemberPayment).toHaveBeenCalledWith({
      studentId: 'ST-1001',
      schoolName: 'Blue Nile Academy',
      amount: 1500,
      channel: 'mobile',
    });
    expect(paymentNotificationPort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'School Payment Successful',
        message: expect.stringContaining('Bethel Alemu'),
      }),
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment_success',
        status: 'sent',
        entityType: 'school_payment',
        actionLabel: 'Open payment details',
        priority: 'normal',
        deepLink: expect.stringContaining('/payments/receipts?'),
      }),
    );
    expect(auditService.logActorAction).toHaveBeenCalledWith(
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

  it('creates a qr payment transaction and payment notification', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };
    const accountId = new Types.ObjectId();
    const branchId = new Types.ObjectId();

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(currentUser.sub),
        isActive: true,
        kycStatus: 'verified',
      }),
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    savingsAccountModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: accountId,
        memberId: new Types.ObjectId(currentUser.sub),
        branchId,
        balance: 4000,
        currency: 'ETB',
        isActive: true,
      }),
    });
    savingsAccountModel.findOneAndUpdate.mockResolvedValue({
      _id: accountId,
      memberId: new Types.ObjectId(currentUser.sub),
      branchId,
      balance: 3750,
      currency: 'ETB',
      isActive: true,
    });
    paymentNotificationPort.dispatch.mockResolvedValue('sent');

    const result = await service.createQrPayment(currentUser, {
      accountId: accountId.toString(),
      qrPayload: 'merchant:aba-001',
      merchantName: 'ABa Merchant',
      amount: 250,
      narration: 'Cafe payment',
    });

    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'qr_payment',
        channel: 'mobile',
        amount: 250,
        externalReference: 'merchant:aba-001',
      }),
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment_success',
        entityType: 'transaction',
        actionLabel: 'Open receipts',
        priority: 'normal',
        deepLink: '/payments/receipts?filter=qr',
      }),
    );
    expect(auditService.logActorAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'qr_payment_created',
        entityType: 'transaction',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        merchantName: 'ABa Merchant',
        amount: 250,
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

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(currentUser.sub),
        isActive: true,
        kycStatus: 'verified',
      }),
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
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

  it('rejects when account lock is enabled', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(currentUser.sub),
        isActive: true,
        kycStatus: 'verified',
      }),
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ accountLockEnabled: true }),
    });

    await expect(
      service.createSchoolPayment(currentUser, {
        accountId: new Types.ObjectId().toString(),
        studentId: 'ST-1001',
        schoolName: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when the payment would overdraw the account', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };
    const accountId = new Types.ObjectId();

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(currentUser.sub),
        isActive: true,
        kycStatus: 'verified',
      }),
    });
    securityModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    savingsAccountModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: accountId,
        memberId: new Types.ObjectId(currentUser.sub),
        branchId: new Types.ObjectId(),
        balance: 500,
        currency: 'ETB',
        isActive: true,
      }),
    });
    savingsAccountModel.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      service.createSchoolPayment(currentUser, {
        accountId: accountId.toString(),
        studentId: 'ST-1001',
        schoolName: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
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

  it('returns normalized payment receipts for school payments, qr payments, and dispute evidence', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };
    const schoolPaymentId = new Types.ObjectId();
    const transactionId = new Types.ObjectId();
    const accountId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const qrTransactionId = new Types.ObjectId();
    const serviceRequestId = new Types.ObjectId();

    schoolPaymentModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: schoolPaymentId,
            transactionId,
            memberId: new Types.ObjectId(currentUser.sub),
            accountId,
            branchId,
            studentId: 'ST-1001',
            schoolName: 'Blue Nile Academy',
            amount: 1500,
            channel: 'mobile',
            status: 'successful',
            createdAt: new Date('2026-03-20T10:15:00.000Z'),
          },
        ]),
      }),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: qrTransactionId,
            memberId: new Types.ObjectId(currentUser.sub),
            accountId,
            branchId,
            transactionReference: 'QRP-2026-001',
            type: 'qr_payment',
            channel: 'mobile',
            amount: 275,
            currency: 'ETB',
            externalReference: 'merchant:aba-cafe',
            narration: 'QR payment to ABa Cafe',
            createdAt: new Date('2026-03-21T11:45:00.000Z'),
          },
        ]),
      }),
    });
    serviceRequestModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: serviceRequestId,
            memberId: new Types.ObjectId(currentUser.sub),
            type: 'payment_dispute',
            title: 'Payment dispute for SCH-2026-014',
            description: 'Duplicated school fee payment under review.',
            payload: {
              transactionReference: 'SCH-2026-014',
              amount: 3500,
              counterparty: 'Bahir Dar Academy',
              occurredAt: '2026-03-22 08:30',
            },
            attachments: ['receipt.png'],
            status: 'awaiting_customer',
            latestNote: 'Please upload the missing receipt image.',
            createdAt: new Date('2026-03-22T08:30:00.000Z'),
            updatedAt: new Date('2026-03-22T09:10:00.000Z'),
          },
        ]),
      }),
    });

    await expect(service.getMyPaymentReceipts(currentUser)).resolves.toEqual([
      expect.objectContaining({
        receiptId: `service_request_${serviceRequestId.toString()}`,
        receiptType: 'payment_dispute',
        sourceId: serviceRequestId.toString(),
        transactionReference: 'SCH-2026-014',
        amount: 3500,
        counterparty: 'Bahir Dar Academy',
        attachments: ['receipt.png'],
      }),
      expect.objectContaining({
        receiptId: `qr_payment_${qrTransactionId.toString()}`,
        receiptType: 'qr_payment',
        sourceId: qrTransactionId.toString(),
        title: 'ABa Cafe',
        transactionReference: 'QRP-2026-001',
        amount: 275,
        counterparty: 'ABa Cafe',
        attachments: [],
      }),
      expect.objectContaining({
        receiptId: `school_payment_${schoolPaymentId.toString()}`,
        receiptType: 'school_payment',
        sourceId: schoolPaymentId.toString(),
        title: 'Blue Nile Academy',
        amount: 1500,
        channel: 'mobile',
        attachments: [],
      }),
    ]);
  });

  it('returns my payment activity summary from normalized receipts', async () => {
    const currentUser: AuthenticatedUser = {
      sub: new Types.ObjectId().toString(),
      role: UserRole.MEMBER,
      memberType: MemberType.MEMBER,
    };
    const memberId = new Types.ObjectId(currentUser.sub);

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        customerId: 'BUN-100001',
        fullName: 'Abebe Kebede',
        phone: '0911000001',
        preferredBranchName: 'Bahir Dar Branch',
      }),
    });
    schoolPaymentModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            transactionId: new Types.ObjectId(),
            memberId,
            accountId: new Types.ObjectId(),
            branchId: new Types.ObjectId(),
            studentId: 'ST-1001',
            schoolName: 'Blue Nile Academy',
            amount: 1500,
            channel: 'mobile',
            status: 'successful',
            createdAt: new Date('2026-03-20T10:15:00.000Z'),
          },
        ]),
      }),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            accountId: new Types.ObjectId(),
            branchId: new Types.ObjectId(),
            transactionReference: 'QRP-2026-001',
            type: 'qr_payment',
            channel: 'mobile',
            amount: 275,
            currency: 'ETB',
            externalReference: 'merchant:aba-cafe',
            narration: 'QR payment to ABa Cafe',
            createdAt: new Date('2026-03-21T11:45:00.000Z'),
          },
        ]),
      }),
    });
    serviceRequestModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            type: 'payment_dispute',
            title: 'Payment dispute',
            description: 'Duplicate merchant charge.',
            payload: {
              transactionReference: 'TXN-2026-001',
              amount: 12000,
            },
            attachments: ['receipt.png'],
            status: 'submitted',
            createdAt: new Date('2026-03-22T08:30:00.000Z'),
            updatedAt: new Date('2026-03-22T09:10:00.000Z'),
          },
        ]),
      }),
    });

    await expect(service.getMyPaymentActivity(currentUser)).resolves.toEqual(
      expect.objectContaining({
        memberId: memberId.toString(),
        customerId: 'BUN-100001',
        memberName: 'Abebe Kebede',
        openCases: 1,
        totalReceipts: 3,
        qrPayments: 1,
        schoolPayments: 1,
        disputeReceipts: 1,
      }),
    );
  });

  it('returns scoped manager payment receipts for a branch member', async () => {
    const memberId = new Types.ObjectId();
    const schoolPaymentId = new Types.ObjectId();
    const transactionId = new Types.ObjectId();
    const accountId = new Types.ObjectId();
    const branchId = new Types.ObjectId();

    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        preferredBranchName: 'Bahir Dar Branch',
      }),
    });
    schoolPaymentModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: schoolPaymentId,
            transactionId,
            memberId,
            accountId,
            branchId,
            studentId: 'ST-1001',
            schoolName: 'Blue Nile Academy',
            amount: 1500,
            channel: 'mobile',
            status: 'successful',
            createdAt: new Date('2026-03-20T10:15:00.000Z'),
          },
        ]),
      }),
    });
    transactionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    serviceRequestModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(
      service.getManagerPaymentReceipts(
        {
          sub: 'staff_1',
          role: UserRole.BRANCH_MANAGER,
          branchName: 'Bahir Dar Branch',
        },
        memberId.toString(),
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        receiptType: 'school_payment',
        sourceId: schoolPaymentId.toString(),
      }),
    ]);
  });

  it('returns scoped manager payment activity across receipts and payment cases', async () => {
    const memberId = new Types.ObjectId();
    const secondMemberId = new Types.ObjectId();
    const branchId = new Types.ObjectId();
    const districtId = new Types.ObjectId();

    schoolPaymentModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            accountId: new Types.ObjectId(),
            branchId,
            studentId: 'ST-1001',
            schoolName: 'Blue Nile Academy',
            amount: 1500,
            channel: 'mobile',
            status: 'successful',
            createdAt: new Date('2026-03-20T10:15:00.000Z'),
          },
        ]),
      }),
    });
    transactionModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            accountId: new Types.ObjectId(),
            branchId,
            transactionReference: 'QRP-2026-001',
            type: 'qr_payment',
            channel: 'mobile',
            amount: 275,
            currency: 'ETB',
            externalReference: 'merchant:aba-cafe',
            narration: 'QR payment to ABa Cafe',
            createdAt: new Date('2026-03-21T11:45:00.000Z'),
          },
        ]),
      }),
    });
    serviceRequestModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            memberId,
            type: 'payment_dispute',
            status: 'submitted',
            createdAt: new Date('2026-03-22T08:30:00.000Z'),
            updatedAt: new Date('2026-03-22T09:10:00.000Z'),
          },
          {
            _id: new Types.ObjectId(),
            memberId: secondMemberId,
            type: 'failed_transfer',
            status: 'completed',
            createdAt: new Date('2026-03-18T08:30:00.000Z'),
            updatedAt: new Date('2026-03-18T09:10:00.000Z'),
          },
        ]),
      }),
    });
    memberModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: memberId,
          customerId: 'BUN-100001',
          fullName: 'Abebe Kebede',
          phone: '0911000001',
          preferredBranchName: 'Bahir Dar Branch',
          branchId,
          districtId,
        },
        {
          _id: secondMemberId,
          customerId: 'BUN-100002',
          fullName: 'Meseret Alemu',
          phone: '0911000002',
          preferredBranchName: 'Bahir Dar Branch',
          branchId,
          districtId,
        },
      ]),
    });

    await expect(
      service.getManagerPaymentActivity({
        sub: 'staff_1',
        role: UserRole.BRANCH_MANAGER,
        branchId: branchId.toString(),
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        memberId: memberId.toString(),
        customerId: 'BUN-100001',
        totalReceipts: 3,
        qrPayments: 1,
        schoolPayments: 1,
        disputeReceipts: 1,
        openCases: 1,
      }),
      expect.objectContaining({
        memberId: secondMemberId.toString(),
        customerId: 'BUN-100002',
        totalReceipts: 1,
        disputeReceipts: 1,
        openCases: 0,
      }),
    ]);
  });
});
