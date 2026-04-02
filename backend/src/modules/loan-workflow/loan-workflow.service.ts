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
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import { StaffActivityLog, StaffActivityLogDocument } from '../staff-activity/schemas/staff-activity-log.schema';
import { ProcessLoanActionDto } from './dto';
import { LoanTransitionResult } from './interfaces';
import { LoanWorkflowHistory, LoanWorkflowHistoryDocument } from './schemas/loan-workflow-history.schema';

interface LoanTransitionState {
  status: LoanStatus;
  level: LoanWorkflowLevel;
  clearAssignment?: boolean;
}

@Injectable()
export class LoanWorkflowService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(LoanWorkflowHistory.name)
    private readonly workflowHistoryModel: Model<LoanWorkflowHistoryDocument>,
    @InjectModel(StaffActivityLog.name)
    private readonly staffActivityLogModel: Model<StaffActivityLogDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly auditService: AuditService,
  ) {}

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

    await this.notificationModel.create({
      userType: 'member',
      userId: loan.memberId,
      type: NotificationType.LOAN_STATUS,
      status: 'sent',
      title: this.buildNotificationTitle(transition.status),
      message: this.buildNotificationMessage(transition.status, transition.level),
      entityType: 'loan',
      entityId: loan._id,
    });

    await this.auditService.log({
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

  private buildNotificationTitle(status: LoanStatus): string {
    switch (status) {
      case LoanStatus.APPROVED:
        return 'Loan Approved';
      case LoanStatus.REJECTED:
        return 'Loan Rejected';
      case LoanStatus.DISBURSED:
        return 'Loan Disbursed';
      case LoanStatus.CLOSED:
        return 'Loan Closed';
      default:
        return 'Loan Status Updated';
    }
  }

  private buildNotificationMessage(
    status: LoanStatus,
    level: LoanWorkflowLevel,
  ): string {
    if (status === LoanStatus.DISTRICT_REVIEW) {
      return 'Your loan has moved to district review.';
    }

    if (status === LoanStatus.HEAD_OFFICE_REVIEW) {
      return 'Your loan has moved to head office review.';
    }

    if (status === LoanStatus.SUBMITTED) {
      return 'Your loan has been returned for correction and resubmission.';
    }

    return `Your loan is now ${status} at ${level} level.`;
  }
}
