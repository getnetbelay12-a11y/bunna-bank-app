import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  NotificationType,
  NotificationStatus,
  PaymentType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { buildSchoolPaymentNotification } from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import { SchoolReportsService } from '../school-reports/school-reports.service';
import { SchoolPaymentsService } from '../school-payments/school-payments.service';
import {
  ServiceRequest,
  ServiceRequestDocument,
} from '../service-requests/schemas/service-request.schema';
import {
  MemberSecuritySetting,
  MemberSecuritySettingDocument,
} from '../service-placeholders/schemas/member-security-setting.schema';
import { SavingsAccount, SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import {
  CreateQrPaymentDto,
  CreateSchoolPaymentDto,
  SchoolPaymentSummaryQueryDto,
} from './dto';
import {
  PaymentActivityItem,
  PaymentReceiptItem,
  QrPaymentResult,
  SchoolPaymentResult,
  SchoolPaymentSummary,
} from './interfaces';
import {
  PAYMENT_NOTIFICATION_PORT,
  PaymentNotificationPort,
} from './payment-notification.port';
import { SchoolPayment, SchoolPaymentDocument } from './schemas/school-payment.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { StudentsService } from '../students/students.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(SchoolPayment.name)
    private readonly schoolPaymentModel: Model<SchoolPaymentDocument>,
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(ServiceRequest.name)
    private readonly serviceRequestModel: Model<ServiceRequestDocument>,
    @InjectModel(MemberSecuritySetting.name)
    private readonly securityModel: Model<MemberSecuritySettingDocument>,
    @Inject(PAYMENT_NOTIFICATION_PORT)
    private readonly paymentNotificationPort: PaymentNotificationPort,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly schoolPaymentsService: SchoolPaymentsService,
    private readonly studentsService: StudentsService,
    private readonly schoolReportsService: SchoolReportsService,
  ) {}

  async createSchoolPayment(
    currentUser: AuthenticatedUser,
    dto: CreateSchoolPaymentDto,
  ): Promise<SchoolPaymentResult> {
    this.ensureMemberAccess(currentUser);
    const member = await this.loadEligibleMember(currentUser);

    const existingAccount = await this.savingsAccountModel
      .findById(dto.accountId)
      .lean<SavingsAccountDocument | null>();

    if (
      !existingAccount ||
      existingAccount.memberId.toString() !== currentUser.sub ||
      !existingAccount.isActive
    ) {
      throw new NotFoundException('Savings account not found for this member.');
    }

    const account = await this.savingsAccountModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(dto.accountId),
        memberId: new Types.ObjectId(currentUser.sub),
        isActive: true,
        balance: { $gte: dto.amount },
      },
      { $inc: { balance: -dto.amount } },
      { new: true },
    );

    if (!account) {
      throw new BadRequestException(
        'Insufficient available balance for this school payment.',
      );
    }

    const transactionId = new Types.ObjectId();
    const transactionReference = this.buildTransactionReference();

    await this.transactionModel.create({
      _id: transactionId,
      transactionReference,
      memberId: new Types.ObjectId(currentUser.sub),
      accountId: new Types.ObjectId(dto.accountId),
      branchId: account.branchId,
      type: PaymentType.SCHOOL_PAYMENT,
      channel: dto.channel,
      amount: dto.amount,
      currency: account.currency,
      narration: dto.narration ?? `School payment for ${dto.schoolName}`,
    });

    const schoolPayment = await this.schoolPaymentModel.create({
      transactionId,
      memberId: new Types.ObjectId(currentUser.sub),
      accountId: new Types.ObjectId(dto.accountId),
      branchId: account.branchId,
      studentId: dto.studentId,
      schoolName: dto.schoolName,
      amount: dto.amount,
      channel: dto.channel,
      status: 'successful',
    });

    const schoolCollection = this.schoolPaymentsService.recordMemberPayment({
      studentId: dto.studentId,
      schoolName: dto.schoolName,
      amount: dto.amount,
      channel: dto.channel,
    });
    const student = this.studentsService
      .list()
      .find((item) => item.studentId === dto.studentId);
    const performance = this.schoolReportsService.getStudentPerformance({
      studentId: dto.studentId,
      fullName: student?.fullName,
      grade: student?.grade,
    });
    const paymentNotificationPreview = buildSchoolPaymentNotification(
      dto.schoolName,
      NotificationStatus.PENDING,
      {
        studentName: student?.fullName,
        grade: student?.grade,
        latestAverage: performance.latestAverage,
        attendanceRate: performance.attendanceRate,
        remainingBalance: schoolCollection?.remainingBalance,
      },
    );

    const notificationStatus = await this.paymentNotificationPort.dispatch({
      userId: currentUser.sub,
      title: paymentNotificationPreview.title,
      message: paymentNotificationPreview.message,
    });
    const paymentNotification = buildSchoolPaymentNotification(
      dto.schoolName,
      notificationStatus === 'sent'
        ? NotificationStatus.SENT
        : NotificationStatus.FAILED,
      {
        studentName: student?.fullName,
        grade: student?.grade,
        latestAverage: performance.latestAverage,
        attendanceRate: performance.attendanceRate,
        remainingBalance: schoolCollection?.remainingBalance,
      },
    );

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: currentUser.sub,
      userRole: currentUser.role,
      type: NotificationType.PAYMENT_SUCCESS,
      status: paymentNotification.status,
      title: paymentNotification.title,
      message: paymentNotification.message,
      entityType: 'school_payment',
      entityId: schoolPayment._id.toString(),
      actionLabel: 'Open payment details',
      priority: 'normal',
      deepLink:
        `/payments/receipts?receiptId=school_payment_${schoolPayment._id.toString()}` +
        `&studentId=${encodeURIComponent(dto.studentId)}`,
      dataPayload: {
        profileId: dto.studentId,
        route:
          `/payments/receipts?receiptId=school_payment_${schoolPayment._id.toString()}` +
          `&studentId=${encodeURIComponent(dto.studentId)}`,
        receiptId: `school_payment_${schoolPayment._id.toString()}`,
        studentId: dto.studentId,
        studentName: student?.fullName,
        schoolName: dto.schoolName,
        amount: dto.amount,
      },
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'school_payment_created',
      entityType: 'school_payment',
      entityId: schoolPayment._id.toString(),
      before: null,
      after: {
        transactionId: transactionId.toString(),
        amount: dto.amount,
        channel: dto.channel,
        status: 'successful',
        accountBalanceAfter: account.balance,
        memberKycStatus: member.kycStatus,
        schoolCollectionReceiptNo: schoolCollection?.receiptNo,
        schoolCollectionInvoiceNo: schoolCollection?.invoiceNo,
        remainingBalance: schoolCollection?.remainingBalance,
      },
    });

    return {
      schoolPaymentId: schoolPayment._id.toString(),
      transactionId: transactionId.toString(),
      transactionReference,
      notificationStatus,
    };
  }

  async createQrPayment(
    currentUser: AuthenticatedUser,
    dto: CreateQrPaymentDto,
  ): Promise<QrPaymentResult> {
    this.ensureMemberAccess(currentUser);
    const member = await this.loadEligibleMember(currentUser);

    const existingAccount = await this.savingsAccountModel
      .findById(dto.accountId)
      .lean<SavingsAccountDocument | null>();

    if (
      !existingAccount ||
      existingAccount.memberId.toString() !== currentUser.sub ||
      !existingAccount.isActive
    ) {
      throw new NotFoundException('Savings account not found for this member.');
    }

    const account = await this.savingsAccountModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(dto.accountId),
        memberId: new Types.ObjectId(currentUser.sub),
        isActive: true,
        balance: { $gte: dto.amount },
      },
      { $inc: { balance: -dto.amount } },
      { new: true },
    );

    if (!account) {
      throw new BadRequestException(
        'Insufficient available balance for this QR payment.',
      );
    }

    const transactionId = new Types.ObjectId();
    const transactionReference = this.buildTransactionReference('QRP');

    await this.transactionModel.create({
      _id: transactionId,
      transactionReference,
      memberId: new Types.ObjectId(currentUser.sub),
      accountId: new Types.ObjectId(dto.accountId),
      branchId: account.branchId,
      type: PaymentType.QR_PAYMENT,
      channel: 'mobile',
      amount: dto.amount,
      currency: account.currency,
      externalReference: dto.qrPayload,
      narration: dto.narration ?? `QR payment to ${dto.merchantName}`,
    });

    const notificationStatus = await this.paymentNotificationPort.dispatch({
      userId: currentUser.sub,
      title: 'QR Payment Successful',
      message: `Your QR payment to ${dto.merchantName} was recorded successfully.`,
    });

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: currentUser.sub,
      userRole: currentUser.role,
      type: NotificationType.PAYMENT_SUCCESS,
      status:
        notificationStatus === 'sent'
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
      title: 'QR Payment Successful',
      message: `Your QR payment to ${dto.merchantName} was recorded successfully.`,
      entityType: 'transaction',
      entityId: transactionId.toString(),
      actionLabel: 'Open receipts',
      priority: 'normal',
      deepLink: '/payments/receipts?filter=qr',
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'qr_payment_created',
      entityType: 'transaction',
      entityId: transactionId.toString(),
      before: null,
      after: {
        amount: dto.amount,
        merchantName: dto.merchantName,
        accountBalanceAfter: account.balance,
        memberKycStatus: member.kycStatus,
      },
    });

    return {
      transactionId: transactionId.toString(),
      transactionReference,
      notificationStatus,
      merchantName: dto.merchantName,
      amount: dto.amount,
    };
  }

  async getMySchoolPayments(currentUser: AuthenticatedUser) {
    this.ensureMemberAccess(currentUser);

    return this.schoolPaymentModel
      .find({ memberId: new Types.ObjectId(currentUser.sub) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getMyPaymentReceipts(
    currentUser: AuthenticatedUser,
  ): Promise<PaymentReceiptItem[]> {
    this.ensureMemberAccess(currentUser);

    return this.buildPaymentReceiptsForMember(new Types.ObjectId(currentUser.sub));
  }

  async getMyPaymentActivity(
    currentUser: AuthenticatedUser,
  ): Promise<PaymentActivityItem | null> {
    this.ensureMemberAccess(currentUser);

    const member = await this.memberModel
      .findById(currentUser.sub)
      .lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const receipts = await this.buildPaymentReceiptsForMember(
      new Types.ObjectId(currentUser.sub),
    );

    return {
      memberId: member._id.toString(),
      customerId: member.customerId,
      memberName: member.fullName,
      phone: member.phone,
      branchName: member.preferredBranchName,
      openCases: receipts.filter(
        (item) =>
          (item.receiptType === 'payment_dispute' ||
            item.receiptType === 'failed_transfer') &&
          item.status !== 'completed' &&
          item.status !== 'rejected',
      ).length,
      totalReceipts: receipts.length,
      qrPayments: receipts.filter((item) => item.receiptType === 'qr_payment').length,
      schoolPayments: receipts.filter((item) => item.receiptType === 'school_payment').length,
      disputeReceipts: receipts.filter(
        (item) =>
          item.receiptType === 'payment_dispute' ||
          item.receiptType === 'failed_transfer',
      ).length,
      latestActivityAt: receipts.length > 0 ? receipts[0]?.recordedAt : undefined,
    };
  }

  async getManagerPaymentReceipts(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<PaymentReceiptItem[]> {
    this.ensureStaffAccess(currentUser);

    const member = await this.memberModel.findById(memberId).lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    if (
      currentUser.role === UserRole.BRANCH_MANAGER &&
      currentUser.branchName &&
      member.preferredBranchName !== currentUser.branchName
    ) {
      throw new ForbiddenException('This member is outside your branch scope.');
    }

    return this.buildPaymentReceiptsForMember(new Types.ObjectId(memberId));
  }

  async getManagerPaymentActivity(
    currentUser: AuthenticatedUser,
  ): Promise<PaymentActivityItem[]> {
    this.ensureStaffAccess(currentUser);

    const [schoolPayments, qrPayments, paymentRequests] = await Promise.all([
      this.schoolPaymentModel.find({}).sort({ createdAt: -1 }).lean(),
      this.transactionModel
        .find({ type: PaymentType.QR_PAYMENT })
        .sort({ createdAt: -1 })
        .lean(),
      this.serviceRequestModel
        .find({
          type: { $in: ['payment_dispute', 'failed_transfer'] },
        })
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const memberIds = new Set<string>();
    for (const item of schoolPayments) {
      memberIds.add(item.memberId.toString());
    }
    for (const item of qrPayments) {
      memberIds.add(item.memberId.toString());
    }
    for (const item of paymentRequests) {
      memberIds.add(item.memberId.toString());
    }

    if (memberIds.size === 0) {
      return [];
    }

    const memberScopeFilter: Record<string, unknown> = {
      _id: { $in: [...memberIds].map((item) => new Types.ObjectId(item)) },
    };

    if (
      currentUser.role === UserRole.BRANCH_MANAGER ||
      currentUser.role === UserRole.LOAN_OFFICER
    ) {
      if (currentUser.branchId) {
        memberScopeFilter.branchId = new Types.ObjectId(currentUser.branchId);
      } else if (currentUser.branchName) {
        memberScopeFilter.preferredBranchName = currentUser.branchName;
      }
    } else if (
      (currentUser.role === UserRole.DISTRICT_MANAGER ||
        currentUser.role === UserRole.DISTRICT_OFFICER) &&
      currentUser.districtId
    ) {
      memberScopeFilter.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const members = await this.memberModel.find(memberScopeFilter).lean<MemberDocument[]>();
    const membersById = new Map(members.map((item) => [item._id.toString(), item]));
    const activityByMember = new Map<string, PaymentActivityItem>();

    const ensureActivity = (memberId: string) => {
      const existing = activityByMember.get(memberId);
      if (existing) {
        return existing;
      }

      const member = membersById.get(memberId);
      if (!member) {
        return null;
      }

      const created: PaymentActivityItem = {
        memberId,
        customerId: member.customerId,
        memberName: member.fullName,
        phone: member.phone,
        branchName: member.preferredBranchName,
        openCases: 0,
        totalReceipts: 0,
        qrPayments: 0,
        schoolPayments: 0,
        disputeReceipts: 0,
      };
      activityByMember.set(memberId, created);
      return created;
    };

    const bumpLatest = (current: PaymentActivityItem, nextDate?: Date) => {
      if (!nextDate) {
        return;
      }
      if (!current.latestActivityAt || nextDate.getTime() > current.latestActivityAt.getTime()) {
        current.latestActivityAt = nextDate;
      }
    };

    for (const item of schoolPayments) {
      const current = ensureActivity(item.memberId.toString());
      if (!current) {
        continue;
      }
      current.totalReceipts += 1;
      current.schoolPayments += 1;
      bumpLatest(current, item.createdAt);
    }

    for (const item of qrPayments) {
      const current = ensureActivity(item.memberId.toString());
      if (!current) {
        continue;
      }
      current.totalReceipts += 1;
      current.qrPayments += 1;
      bumpLatest(current, item.createdAt);
    }

    for (const item of paymentRequests) {
      const current = ensureActivity(item.memberId.toString());
      if (!current) {
        continue;
      }
      current.totalReceipts += 1;
      current.disputeReceipts += 1;
      if (item.status !== 'completed' && item.status !== 'rejected') {
        current.openCases += 1;
      }
      bumpLatest(current, item.updatedAt ?? item.createdAt);
    }

    return [...activityByMember.values()].sort((left, right) => {
      const leftTime = left.latestActivityAt?.getTime() ?? 0;
      const rightTime = right.latestActivityAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  }

  async getSchoolPaymentSummary(
    currentUser: AuthenticatedUser,
    query: SchoolPaymentSummaryQueryDto,
  ): Promise<SchoolPaymentSummary> {
    this.ensureStaffAccess(currentUser);

    const match: Record<string, unknown> = {};

    if (query.branchId) {
      match.branchId = new Types.ObjectId(query.branchId);
    } else if (currentUser.branchId && currentUser.role === UserRole.BRANCH_MANAGER) {
      match.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (query.dateFrom || query.dateTo) {
      match.createdAt = {};
      if (query.dateFrom) {
        (match.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (match.createdAt as Record<string, Date>).$lte = new Date(query.dateTo);
      }
    }

    const [summary] = await this.schoolPaymentModel.aggregate<SchoolPaymentSummary>([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          mobilePayments: {
            $sum: { $cond: [{ $eq: ['$channel', 'mobile'] }, 1, 0] },
          },
          branchPayments: {
            $sum: { $cond: [{ $eq: ['$channel', 'branch'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalPayments: 1,
          totalAmount: 1,
          mobilePayments: 1,
          branchPayments: 1,
        },
      },
    ]);

    return (
      summary ?? {
        totalPayments: 0,
        totalAmount: 0,
        mobilePayments: 0,
        branchPayments: 0,
      }
    );
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only members can create school payments.');
    }
  }

  private ensureStaffAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only staff users can view payment summaries.');
    }
  }

  private async loadEligibleMember(currentUser: AuthenticatedUser) {
    const [member, security] = await Promise.all([
      this.memberModel.findById(currentUser.sub).lean<MemberDocument | null>(),
      this.securityModel
        .findOne({ memberId: new Types.ObjectId(currentUser.sub) })
        .lean<MemberSecuritySettingDocument | null>(),
    ]);

    if (!member || !member.isActive) {
      throw new ForbiddenException('Member account is inactive.');
    }

    if (!this.hasVerifiedKyc(member.kycStatus)) {
      throw new ForbiddenException(
        'Complete Fayda verification before using school payment services.',
      );
    }

    if (security?.accountLockEnabled) {
      throw new ForbiddenException(
        'Account lock is enabled. Unlock the account before making payments.',
      );
    }

    return member;
  }

  private hasVerifiedKyc(status?: string) {
    return ['verified', 'demo_approved', 'active_demo'].includes(
      status?.toLowerCase() ?? '',
    );
  }

  private buildTransactionReference(prefix = 'TXN'): string {
    return `${prefix}-${Date.now()}`;
  }

  private async buildPaymentReceiptsForMember(
    memberId: Types.ObjectId,
  ): Promise<PaymentReceiptItem[]> {
    const [schoolPayments, qrPayments, paymentRequests] = await Promise.all([
      this.schoolPaymentModel.find({ memberId }).sort({ createdAt: -1 }).lean(),
      this.transactionModel
        .find({ memberId, type: PaymentType.QR_PAYMENT })
        .sort({ createdAt: -1 })
        .lean(),
      this.serviceRequestModel
        .find({
          memberId,
          type: { $in: ['payment_dispute', 'failed_transfer'] },
        })
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const schoolPaymentReceipts: PaymentReceiptItem[] = schoolPayments.map((item) => ({
      receiptId: `school_payment_${item._id.toString()}`,
      receiptType: 'school_payment',
      sourceId: item._id.toString(),
      title: item.schoolName,
      description: `School payment for ${item.schoolName}.`,
      status: item.status,
      amount: item.amount,
      currency: 'ETB',
      channel: item.channel,
      attachments: [],
      recordedAt: item.createdAt,
      metadata: {
        studentId: item.studentId,
        accountId: item.accountId.toString(),
        branchId: item.branchId.toString(),
        transactionId: item.transactionId.toString(),
      },
    }));

    const qrPaymentReceipts: PaymentReceiptItem[] = qrPayments.map((item) => {
      const merchantName = this.extractQrMerchantName(item.narration);

      return {
        receiptId: `qr_payment_${item._id.toString()}`,
        receiptType: 'qr_payment',
        sourceId: item._id.toString(),
        title: merchantName ?? 'QR Merchant Payment',
        description: item.narration ?? 'QR merchant payment.',
        status: 'successful',
        amount: item.amount,
        currency: item.currency,
        transactionReference: item.transactionReference,
        counterparty: merchantName,
        channel: item.channel,
        attachments: [],
        recordedAt: item.createdAt,
        metadata: {
          accountId: item.accountId.toString(),
          branchId: item.branchId.toString(),
          qrPayload: item.externalReference,
        },
      };
    });

    const serviceRequestReceipts: PaymentReceiptItem[] = paymentRequests.map((item) => ({
      receiptId: `service_request_${item._id.toString()}`,
      receiptType:
        item.type === 'failed_transfer' ? 'failed_transfer' : 'payment_dispute',
      sourceId: item._id.toString(),
      title: item.title,
      description: item.latestNote ?? item.description,
      status: item.status,
      amount:
        typeof item.payload?.amount === 'number'
          ? item.payload.amount
          : undefined,
      currency: 'ETB',
      transactionReference:
        typeof item.payload?.transactionReference === 'string'
          ? item.payload.transactionReference
          : undefined,
      counterparty:
        typeof item.payload?.counterparty === 'string'
          ? item.payload.counterparty
          : undefined,
      attachments: item.attachments ?? [],
      recordedAt: item.updatedAt ?? item.createdAt,
      metadata: {
        occurredAt:
          typeof item.payload?.occurredAt === 'string'
            ? item.payload.occurredAt
            : undefined,
      },
    }));

    return [
      ...schoolPaymentReceipts,
      ...qrPaymentReceipts,
      ...serviceRequestReceipts,
    ].sort((left, right) => {
      const leftTime = left.recordedAt?.getTime() ?? 0;
      const rightTime = right.recordedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  }

  private extractQrMerchantName(narration?: string): string | undefined {
    if (!narration) {
      return undefined;
    }

    const prefix = 'QR payment to ';
    if (narration.startsWith(prefix)) {
      return narration.slice(prefix.length).trim() || undefined;
    }

    return undefined;
  }
}
