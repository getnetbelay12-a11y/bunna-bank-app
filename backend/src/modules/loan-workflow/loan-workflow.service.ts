import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BRANCH_MAX_APPROVAL_AMOUNT } from '../../common/constants';
import {
  ActivityType,
  LoanAction,
  LoanStatus,
  LoanWorkflowLevel,
  PaymentType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { ChatConversation, ChatConversationDocument } from '../chat/schemas/chat-conversation.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { buildLoanWorkflowNotification } from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema';
import { AutopaySetting, AutopaySettingDocument } from '../service-placeholders/schemas/autopay-setting.schema';
import { StaffActivityLog, StaffActivityLogDocument } from '../staff-activity/schemas/staff-activity-log.schema';
import { ProcessLoanActionDto } from './dto';
import {
  LoanCustomerProfile,
  LoanQueueAction,
  LoanQueueDetail,
  LoanQueueItem,
  LoanTransitionResult,
} from './interfaces';
import { LoanWorkflowHistory, LoanWorkflowHistoryDocument } from './schemas/loan-workflow-history.schema';

interface LoanTransitionState {
  status: LoanStatus;
  level: LoanWorkflowLevel;
  clearAssignment?: boolean;
}

type LoanQueueActionSource = Pick<LoanQueueItem, 'amount' | 'level' | 'status'>;

@Injectable()
export class LoanWorkflowService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(AutopaySetting.name)
    private readonly autopaySettingModel: Model<AutopaySettingDocument>,
    @InjectModel(ChatConversation.name)
    private readonly chatConversationModel: Model<ChatConversationDocument>,
    @InjectModel(LoanWorkflowHistory.name)
    private readonly workflowHistoryModel: Model<LoanWorkflowHistoryDocument>,
    @InjectModel(StaffActivityLog.name)
    private readonly staffActivityLogModel: Model<StaffActivityLogDocument>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getLoanQueue(currentUser: AuthenticatedUser): Promise<LoanQueueItem[]> {
    this.ensureStaffAccess(currentUser);

    const match: Record<string, unknown> = {
      status: {
        $in: [
          LoanStatus.SUBMITTED,
          LoanStatus.BRANCH_REVIEW,
          LoanStatus.DISTRICT_REVIEW,
          LoanStatus.HEAD_OFFICE_REVIEW,
          LoanStatus.APPROVED,
        ],
      },
    };

    if (currentUser.branchId && currentUser.role === UserRole.BRANCH_MANAGER) {
      match.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      currentUser.districtId &&
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(
        currentUser.role,
      )
    ) {
      match.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const items = await this.loanModel.aggregate<Omit<LoanQueueItem, 'availableActions'>>([
      { $match: match },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      {
        $project: {
          _id: 0,
          loanId: { $toString: '$_id' },
          memberId: { $toString: '$memberId' },
          customerId: '$member.customerId',
          memberName: '$member.fullName',
          amount: 1,
          level: '$currentLevel',
          status: 1,
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          deficiencyReasons: { $ifNull: ['$deficiencyReasons', []] },
          updatedAt: {
            $dateToString: {
              date: '$updatedAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
        },
      },
      { $sort: { updatedAt: -1, amount: -1 } },
    ]);

    return items.map((item) => ({
      ...item,
      availableActions: this.buildAvailableActions(item),
    }));
  }

  async getLoanQueueDetail(
    currentUser: AuthenticatedUser,
    loanId: string,
  ): Promise<LoanQueueDetail> {
    this.ensureStaffAccess(currentUser);

    const baseScope: Record<string, unknown> = { _id: new Types.ObjectId(loanId) };

    if (currentUser.branchId && currentUser.role === UserRole.BRANCH_MANAGER) {
      baseScope.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      currentUser.districtId &&
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(
        currentUser.role,
      )
    ) {
      baseScope.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const [item] = await this.loanModel.aggregate<LoanQueueItem>([
      { $match: baseScope },
      {
        $lookup: {
          from: 'members',
          localField: 'memberId',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      {
        $project: {
          _id: 0,
          loanId: { $toString: '$_id' },
          memberId: { $toString: '$memberId' },
          customerId: '$member.customerId',
          memberName: '$member.fullName',
          amount: 1,
          level: '$currentLevel',
          status: 1,
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          deficiencyReasons: { $ifNull: ['$deficiencyReasons', []] },
          updatedAt: {
            $dateToString: {
              date: '$updatedAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
        },
      },
    ]);

    if (!item) {
      throw new NotFoundException('Loan queue item was not found.');
    }

    const history = await this.workflowHistoryModel
      .find({ loanId: new Types.ObjectId(loanId) })
      .sort({ createdAt: 1 })
      .lean<LoanWorkflowHistoryDocument[]>();

    return {
      ...item,
      nextAction: this.buildNextActionGuidance(item),
      availableActions: this.buildAvailableActions(item),
      history: history.map((entry) => ({
        action: entry.action,
        level: entry.level,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        actorRole: entry.actorRole,
        comment: entry.comment,
        createdAt: entry.createdAt?.toISOString(),
      })),
    };
  }

  async getLoanCustomerProfile(
    currentUser: AuthenticatedUser,
    loanId: string,
  ): Promise<LoanCustomerProfile> {
    this.ensureStaffAccess(currentUser);

    const loan = await this.findAccessibleLoan(currentUser, loanId);

    const member = await this.memberModel.findById(loan.memberId).lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Loan customer was not found.');
    }

    const memberId = loan.memberId as Types.ObjectId;
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [loans, repayments, autopaySettings, openLoanChats] = await Promise.all([
      this.loanModel
        .find({ memberId })
        .sort({ createdAt: -1 })
        .lean<LoanDocument[]>(),
      this.transactionModel
        .find({
          memberId,
          type: PaymentType.LOAN_REPAYMENT,
          createdAt: { $gte: ninetyDaysAgo },
        })
        .sort({ createdAt: -1 })
        .lean<TransactionDocument[]>(),
      this.autopaySettingModel
        .find({ memberId, enabled: true })
        .lean<AutopaySettingDocument[]>(),
      this.chatConversationModel
        .find({
          memberId,
          category: 'loan_issue',
          status: { $in: ['open', 'assigned', 'waiting_agent', 'waiting_customer'] },
        })
        .lean<ChatConversationDocument[]>(),
    ]);

    const activeStatuses = [
      LoanStatus.SUBMITTED,
      LoanStatus.BRANCH_REVIEW,
      LoanStatus.DISTRICT_REVIEW,
      LoanStatus.HEAD_OFFICE_REVIEW,
      LoanStatus.APPROVED,
      LoanStatus.DISBURSED,
      LoanStatus.NEEDS_MORE_INFO,
    ];
    const activeLoans = loans.filter((item) => activeStatuses.includes(item.status));
    const closedLoans = loans.filter((item) => item.status === LoanStatus.CLOSED);
    const rejectedLoans = loans.filter((item) => item.status === LoanStatus.REJECTED);
    const totalBorrowedAmount = loans.reduce((sum, item) => sum + item.amount, 0);
    const totalClosedAmount = closedLoans.reduce((sum, item) => sum + item.amount, 0);
    const repaymentCount90d = repayments.length;
    const autopayServices = autopaySettings.map((item) => item.serviceType);
    const autopayEnabled = autopayServices.length > 0;

    const repaymentSignal: LoanCustomerProfile['repaymentSignal'] =
      closedLoans.length > 0 && repaymentCount90d >= 2 && openLoanChats.length === 0
        ? 'strong'
        : repaymentCount90d > 0 || closedLoans.length > 0
          ? 'steady'
          : 'watch';

    const loyaltyTier: LoanCustomerProfile['loyaltyTier'] =
      repaymentSignal === 'strong' && closedLoans.length > 0
        ? 'gold'
        : repaymentSignal !== 'watch'
          ? 'silver'
          : 'watch';

    const nextBestAction =
      loyaltyTier === 'gold'
        ? 'Offer loyalty review for top-up or pre-approved follow-up'
        : activeLoans.length > 0 && !autopayEnabled
          ? 'Offer loan repayment AutoPay or reminder support'
          : openLoanChats.length > 0
            ? 'Resolve open support issues before sending a new offer'
            : 'Keep customer on a repayment and reminder watchlist';

    const offerCue =
      loyaltyTier === 'gold'
        ? 'Strong repayment behavior can support a loyalty offer, renewal outreach, or top-up review.'
        : loyaltyTier === 'silver'
          ? 'Customer is showing usable repayment discipline. Offer reminders or AutoPay to improve stickiness.'
          : 'Do not send a credit offer yet. Focus on support, reminders, or documentation completion first.';

    return {
      memberId: member._id.toString(),
      customerId: member.customerId,
      memberName: member.fullName,
      branchId: member.branchId?.toString(),
      districtId: member.districtId?.toString(),
      activeLoans: activeLoans.length,
      closedLoans: closedLoans.length,
      rejectedLoans: rejectedLoans.length,
      totalLoanCount: loans.length,
      totalBorrowedAmount,
      totalClosedAmount,
      repaymentCount90d,
      lastRepaymentAt: repayments[0]?.createdAt?.toISOString(),
      autopayEnabled,
      autopayServices,
      repaymentSignal,
      loyaltyTier,
      nextBestAction,
      offerCue,
      openSupportCases: openLoanChats.length,
      activeLoanStatuses: activeLoans.map((item) => item.status),
    };
  }

  async processAction(
    currentUser: AuthenticatedUser,
    loanId: string,
    dto: ProcessLoanActionDto,
  ): Promise<LoanTransitionResult> {
    this.ensureStaffAccess(currentUser);

    const loan = await this.loanModel.findById(loanId);

    if (!loan) {
      throw new NotFoundException('Loan not found.');
    }

    this.ensureUserCanActAtLevel(currentUser, loan.currentLevel);

    const previousStatus = loan.status;
    const previousLevel = loan.currentLevel;
    const transition = this.resolveTransition(loan, dto.action);

    loan.status = transition.status;
    loan.currentLevel = transition.level;
    loan.deficiencyReasons = this.resolveDeficiencyReasons(loan, dto);

    if (transition.clearAssignment) {
      loan.assignedToStaffId = undefined;
    }

    await loan.save();

    await this.workflowHistoryModel.create({
      loanId: loan._id,
      action: dto.action,
      level: previousLevel,
      fromStatus: previousStatus,
      toStatus: transition.status,
      actorId: new Types.ObjectId(currentUser.sub),
      actorRole: currentUser.role,
      comment: dto.comment,
    });

    await this.staffActivityLogModel.create({
      staffId: new Types.ObjectId(currentUser.sub),
      memberId: loan.memberId,
      branchId: loan.branchId,
      districtId: loan.districtId,
      activityType: this.mapActivityType(dto.action),
      referenceType: 'loan',
      referenceId: loan._id,
      amount: loan.amount,
    });

    const notification = buildLoanWorkflowNotification({
      action: dto.action,
      status: transition.status,
      level: transition.level,
      deficiencyReasons: loan.deficiencyReasons ?? [],
    });

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: loan.memberId.toString(),
      type: notification.type,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      entityType: 'loan',
      entityId: loan._id.toString(),
      actionLabel: 'Open loan',
      priority:
        dto.action === LoanAction.RETURN_FOR_CORRECTION ||
        dto.action === LoanAction.REJECT
          ? 'high'
          : 'normal',
      deepLink: `/loans/${loan._id.toString()}`,
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: `loan_${dto.action}`,
      entityType: 'loan',
      entityId: loan._id.toString(),
      before: {
        status: previousStatus,
        currentLevel: previousLevel,
      },
      after: {
        status: transition.status,
        currentLevel: transition.level,
      },
    });

    return {
      loanId: loan._id.toString(),
      previousStatus,
      status: transition.status,
      currentLevel: transition.level,
    };
  }

  private ensureStaffAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role === UserRole.MEMBER ||
      currentUser.role === UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only staff users can process loan workflow.');
    }
  }

  private ensureUserCanActAtLevel(
    currentUser: AuthenticatedUser,
    level: LoanWorkflowLevel,
  ): void {
    const roleMap: Record<LoanWorkflowLevel, UserRole[]> = {
      [LoanWorkflowLevel.MEMBER]: [],
      [LoanWorkflowLevel.BRANCH]: [UserRole.LOAN_OFFICER, UserRole.BRANCH_MANAGER],
      [LoanWorkflowLevel.DISTRICT]: [
        UserRole.DISTRICT_OFFICER,
        UserRole.DISTRICT_MANAGER,
      ],
      [LoanWorkflowLevel.HEAD_OFFICE]: [
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.ADMIN,
      ],
    };

    if (!roleMap[level].includes(currentUser.role)) {
      throw new ForbiddenException('User cannot process loans at this workflow level.');
    }
  }

  private async findAccessibleLoan(
    currentUser: AuthenticatedUser,
    loanId: string,
  ): Promise<LoanDocument> {
    const scope: Record<string, unknown> = { _id: new Types.ObjectId(loanId) };

    if (currentUser.branchId && currentUser.role === UserRole.BRANCH_MANAGER) {
      scope.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      currentUser.districtId &&
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(currentUser.role)
    ) {
      scope.districtId = new Types.ObjectId(currentUser.districtId);
    }

    const loan = await this.loanModel.findOne(scope);
    if (!loan) {
      throw new NotFoundException('Loan queue item was not found.');
    }

    return loan;
  }

  private resolveTransition(
    loan: LoanDocument,
    action: LoanAction,
  ): LoanTransitionState {
    if (loan.status === LoanStatus.REJECTED && action !== LoanAction.CLOSE) {
      throw new BadRequestException('Rejected loans cannot be processed further.');
    }

    if (loan.status === LoanStatus.APPROVED && action === LoanAction.REJECT) {
      throw new BadRequestException('Approved loans cannot be rejected.');
    }

    switch (action) {
      case LoanAction.REVIEW:
        this.assertStatusIn(loan.status, [LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW, LoanStatus.DISTRICT_REVIEW, LoanStatus.HEAD_OFFICE_REVIEW]);
        return { status: loan.status, level: loan.currentLevel };
      case LoanAction.APPROVE:
        return this.resolveApproveTransition(loan);
      case LoanAction.REJECT:
        this.assertStatusIn(loan.status, [
          LoanStatus.SUBMITTED,
          LoanStatus.BRANCH_REVIEW,
          LoanStatus.DISTRICT_REVIEW,
          LoanStatus.HEAD_OFFICE_REVIEW,
        ]);
        return { status: LoanStatus.REJECTED, level: loan.currentLevel, clearAssignment: true };
      case LoanAction.FORWARD:
        return this.resolveForwardTransition(loan);
      case LoanAction.RETURN_FOR_CORRECTION:
        this.assertStatusIn(loan.status, [
          LoanStatus.SUBMITTED,
          LoanStatus.BRANCH_REVIEW,
          LoanStatus.DISTRICT_REVIEW,
          LoanStatus.HEAD_OFFICE_REVIEW,
        ]);
        return { status: LoanStatus.SUBMITTED, level: LoanWorkflowLevel.BRANCH, clearAssignment: true };
      case LoanAction.DISBURSE:
        if (loan.status !== LoanStatus.APPROVED) {
          throw new BadRequestException('Loan must be approved before disbursement.');
        }
        return { status: LoanStatus.DISBURSED, level: loan.currentLevel };
      case LoanAction.CLOSE:
        this.assertStatusIn(loan.status, [LoanStatus.DISBURSED, LoanStatus.REJECTED]);
        return { status: LoanStatus.CLOSED, level: loan.currentLevel, clearAssignment: true };
      default:
        throw new BadRequestException('Unsupported loan workflow action.');
    }
  }

  private resolveApproveTransition(loan: LoanDocument): LoanTransitionState {
    this.assertStatusIn(loan.status, [
      LoanStatus.SUBMITTED,
      LoanStatus.BRANCH_REVIEW,
      LoanStatus.DISTRICT_REVIEW,
      LoanStatus.HEAD_OFFICE_REVIEW,
    ]);

    if (loan.currentLevel === LoanWorkflowLevel.BRANCH && loan.amount > BRANCH_MAX_APPROVAL_AMOUNT) {
      throw new BadRequestException('Branch level cannot approve loans above the branch threshold.');
    }

    if (loan.currentLevel === LoanWorkflowLevel.DISTRICT && loan.amount > BRANCH_MAX_APPROVAL_AMOUNT) {
      throw new BadRequestException('District level must forward high-value loans to head office.');
    }

    return {
      status: LoanStatus.APPROVED,
      level: loan.currentLevel,
      clearAssignment: true,
    };
  }

  private resolveForwardTransition(loan: LoanDocument): LoanTransitionState {
    this.assertStatusIn(loan.status, [LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW, LoanStatus.DISTRICT_REVIEW]);

    if (loan.currentLevel === LoanWorkflowLevel.BRANCH) {
      return {
        status: LoanStatus.DISTRICT_REVIEW,
        level: LoanWorkflowLevel.DISTRICT,
        clearAssignment: true,
      };
    }

    if (loan.currentLevel === LoanWorkflowLevel.DISTRICT) {
      return {
        status: LoanStatus.HEAD_OFFICE_REVIEW,
        level: LoanWorkflowLevel.HEAD_OFFICE,
        clearAssignment: true,
      };
    }

    throw new BadRequestException('Loan cannot be forwarded from the current workflow level.');
  }

  private resolveDeficiencyReasons(
    loan: LoanDocument,
    dto: ProcessLoanActionDto,
  ): string[] {
    if (dto.action === LoanAction.RETURN_FOR_CORRECTION) {
      const reasons =
        dto.deficiencyReasons
          ?.map((item) => item.trim())
          .filter((item) => item.length > 0) ?? [];

      if (reasons.length === 0) {
        throw new BadRequestException(
          'Deficiency reasons are required when returning a loan for correction.',
        );
      }

      return reasons;
    }

    if (
      dto.action === LoanAction.APPROVE ||
      dto.action === LoanAction.DISBURSE ||
      dto.action === LoanAction.CLOSE
    ) {
      return [];
    }

    return loan.deficiencyReasons ?? [];
  }

  private buildNextActionGuidance(item: LoanQueueItem) {
    if (item.deficiencyReasons.length > 0) {
      return `Customer correction is required before approval: ${item.deficiencyReasons.join(', ')}.`;
    }

    if (item.level === LoanWorkflowLevel.BRANCH) {
      return 'Continue branch review or forward the case if it exceeds branch approval limits.';
    }

    if (item.level === LoanWorkflowLevel.DISTRICT) {
      return 'District team should complete review or escalate higher-value cases to head office.';
    }

    if (item.level === LoanWorkflowLevel.HEAD_OFFICE) {
      return 'Head office should complete final controls, approve, or return for correction.';
    }

    return 'Review the latest workflow history and decide the next operational step.';
  }

  private buildAvailableActions(item: LoanQueueActionSource): LoanQueueAction[] {
    const actions: LoanQueueAction[] = [];

    if (
      [
        LoanStatus.SUBMITTED,
        LoanStatus.BRANCH_REVIEW,
        LoanStatus.DISTRICT_REVIEW,
        LoanStatus.HEAD_OFFICE_REVIEW,
      ].includes(item.status as LoanStatus)
    ) {
      actions.push(LoanAction.REVIEW, LoanAction.RETURN_FOR_CORRECTION);
    }

    if (
      [LoanWorkflowLevel.BRANCH, LoanWorkflowLevel.DISTRICT].includes(
        item.level as LoanWorkflowLevel,
      ) &&
      [LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW, LoanStatus.DISTRICT_REVIEW].includes(
        item.status as LoanStatus,
      )
    ) {
      actions.push(LoanAction.FORWARD);
    }

    if (this.canApproveAtCurrentLevel(item)) {
      actions.push(LoanAction.APPROVE);
    }

    return actions;
  }

  private canApproveAtCurrentLevel(item: LoanQueueActionSource): boolean {
    if (
      ![
        LoanStatus.SUBMITTED,
        LoanStatus.BRANCH_REVIEW,
        LoanStatus.DISTRICT_REVIEW,
        LoanStatus.HEAD_OFFICE_REVIEW,
      ].includes(item.status as LoanStatus)
    ) {
      return false;
    }

    if ((item.level as LoanWorkflowLevel) === LoanWorkflowLevel.HEAD_OFFICE) {
      return true;
    }

    return item.amount <= BRANCH_MAX_APPROVAL_AMOUNT;
  }

  private assertStatusIn(status: LoanStatus, allowed: LoanStatus[]) {
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid loan state transition.');
    }
  }

  private mapActivityType(action: LoanAction): ActivityType {
    switch (action) {
      case LoanAction.APPROVE:
        return ActivityType.LOAN_APPROVED;
      case LoanAction.REJECT:
        return ActivityType.LOAN_REJECTED;
      case LoanAction.FORWARD:
        return ActivityType.LOAN_FORWARDED;
      default:
        return ActivityType.LOAN_REVIEWED;
    }
  }
}
