import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { NotificationType, PaymentType, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import { SavingsAccount, SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { CreateSchoolPaymentDto, SchoolPaymentSummaryQueryDto } from './dto';
import { SchoolPaymentResult, SchoolPaymentSummary } from './interfaces';
import {
  PAYMENT_NOTIFICATION_PORT,
  PaymentNotificationPort,
} from './payment-notification.port';
import { SchoolPayment, SchoolPaymentDocument } from './schemas/school-payment.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(SchoolPayment.name)
    private readonly schoolPaymentModel: Model<SchoolPaymentDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
    @Inject(PAYMENT_NOTIFICATION_PORT)
    private readonly paymentNotificationPort: PaymentNotificationPort,
    private readonly auditService: AuditService,
  ) {}

  async createSchoolPayment(
    currentUser: AuthenticatedUser,
    dto: CreateSchoolPaymentDto,
  ): Promise<SchoolPaymentResult> {
    this.ensureMemberAccess(currentUser);

    const account = await this.savingsAccountModel
      .findById(dto.accountId)
      .lean<SavingsAccountDocument | null>();

    if (!account || account.memberId.toString() !== currentUser.sub) {
      throw new NotFoundException('Savings account not found for this member.');
    }

    const transactionId = new Types.ObjectId();
    const transactionReference = this.buildTransactionReference();
    const now = new Date();

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

    const notificationStatus = await this.paymentNotificationPort.dispatch({
      userId: currentUser.sub,
      title: 'School Payment Successful',
      message: `Your payment to ${dto.schoolName} has been recorded successfully.`,
    });

    await this.notificationModel.create({
      userType: 'member',
      userId: new Types.ObjectId(currentUser.sub),
      userRole: currentUser.role,
      type: NotificationType.PAYMENT,
      status: notificationStatus,
      title: 'School Payment Successful',
      message: `Your payment to ${dto.schoolName} has been recorded successfully.`,
      entityType: 'school_payment',
      entityId: schoolPayment._id,
      readAt: undefined,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log({
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
      },
    });

    return {
      schoolPaymentId: schoolPayment._id.toString(),
      transactionId: transactionId.toString(),
      transactionReference,
      notificationStatus,
    };
  }

  async getMySchoolPayments(currentUser: AuthenticatedUser) {
    this.ensureMemberAccess(currentUser);

    return this.schoolPaymentModel
      .find({ memberId: new Types.ObjectId(currentUser.sub) })
      .sort({ createdAt: -1 })
      .lean();
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

  private buildTransactionReference(): string {
    return `TXN-${Date.now()}`;
  }
}
