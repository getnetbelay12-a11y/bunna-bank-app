import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LoanStatus,
  LoanWorkflowLevel,
  NotificationStatus,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ChatService } from '../chat/chat.service';
import { ChatIssueCategory } from '../chat/dto/create-chat-conversation.dto';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DemoService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly chatService: ChatService,
  ) {}

  async triggerSchoolPaymentNotification(
    currentUser: AuthenticatedUser,
    payload: {
      userId?: string;
      profileId?: string;
    },
  ) {
    const targetMember = await this.resolveTargetMember(currentUser, payload.userId);
    const profileId = payload.profileId?.trim() || 'school_profile_001';
    const route = `/school-payment/${profileId}`;

    const notification = await this.notificationsService.createNotification({
      userType: 'member',
      userId: targetMember._id.toString(),
      userRole: targetMember.role,
      type: NotificationType.SCHOOL_PAYMENT_DUE,
      status: NotificationStatus.SENT,
      title: 'School payment due',
      message: 'Bright Future School ETB 5,000 is due today.',
      entityType: 'school_payment_profile',
      actionLabel: 'Pay now',
      priority: 'high',
      deepLink: route,
      dataPayload: {
        type: 'school_payment_due',
        profileId,
        route,
      },
    });

    return {
      notificationId: notification.id,
      route,
      profileId,
      userId: targetMember._id.toString(),
    };
  }

  async createDemoChat(
    currentUser: AuthenticatedUser,
    payload: {
      userId?: string;
      issueCategory?: string;
      initialMessage?: string;
      loanId?: string;
    },
  ) {
    const targetMember = await this.resolveTargetMember(currentUser, payload.userId);

    return this.chatService.createConversation(
      this.asMemberPrincipal(targetMember),
      {
        issueCategory:
          (payload.issueCategory?.trim() as ChatIssueCategory | undefined) ??
          ChatIssueCategory.GENERAL_HELP,
        initialMessage:
          payload.initialMessage?.trim() ||
          'Hello, I need help with the school payment and loan status demo.',
        loanId: payload.loanId?.trim() || undefined,
      },
    );
  }

  async updateDemoLoan(
    _currentUser: AuthenticatedUser,
    payload: {
      loanId?: string;
      status: LoanStatus;
      comment?: string;
    },
  ) {
    const loan = payload.loanId?.trim()
      ? await this.loanModel.findById(payload.loanId)
      : await this.loanModel.findOne({ status: LoanStatus.DISTRICT_REVIEW }).sort({
          updatedAt: -1,
        });

    if (!loan) {
      throw new NotFoundException('Loan not found.');
    }

    loan.status = payload.status;
    loan.currentLevel = this.resolveCurrentLevel(payload.status);
    if (payload.status === LoanStatus.DISTRICT_REVIEW) {
      loan.assignedToStaffId = undefined;
    }
    await loan.save();

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: loan.memberId.toString(),
      type:
        payload.status === LoanStatus.APPROVED
          ? NotificationType.LOAN_APPROVED
          : NotificationType.LOAN_STATUS,
      status: NotificationStatus.SENT,
      title:
        payload.status === LoanStatus.APPROVED
          ? 'Loan approved'
          : 'Loan status updated',
      message:
        payload.comment?.trim() ||
        `Your loan is now at ${payload.status.replaceAll('_', ' ')}.`,
      entityType: 'loan',
      entityId: loan._id.toString(),
      actionLabel: 'Open loan',
      priority: payload.status === LoanStatus.APPROVED ? 'high' : 'normal',
      deepLink: `/loans/${loan._id.toString()}`,
      dataPayload: {
        type: 'loan_update',
        loanId: loan._id.toString(),
        status: payload.status,
      },
    });

    return {
      loanId: loan._id.toString(),
      status: loan.status,
      currentLevel: loan.currentLevel,
    };
  }

  private async resolveTargetMember(currentUser: AuthenticatedUser, userId?: string) {
    if (currentUser.role === UserRole.MEMBER || currentUser.role === UserRole.SHAREHOLDER_MEMBER) {
      const member = await this.memberModel.findById(currentUser.sub);
      if (!member) {
        throw new NotFoundException('Current member not found.');
      }
      return member;
    }

    const targetId = userId?.trim();
    if (targetId) {
      const member = await this.memberModel.findById(targetId);
      if (member) {
        return member;
      }
    }

    const seededMember = await this.memberModel.findOne({ phone: '0911000001' });
    if (!seededMember) {
      throw new NotFoundException('Seeded demo member not found.');
    }
    return seededMember;
  }

  private asMemberPrincipal(member: MemberDocument): AuthenticatedUser {
    return {
      sub: member._id.toString(),
      memberId: member._id.toString(),
      role: member.role,
      memberType: member.memberType,
      fullName: member.fullName,
      phone: member.phone,
      customerId: member.customerId,
      branchId: member.branchId?.toString(),
      districtId: member.districtId?.toString(),
    };
  }

  private resolveCurrentLevel(status: LoanStatus): LoanWorkflowLevel {
    switch (status) {
      case LoanStatus.SUBMITTED:
        return LoanWorkflowLevel.BRANCH;
      case LoanStatus.BRANCH_REVIEW:
        return LoanWorkflowLevel.BRANCH;
      case LoanStatus.DISTRICT_REVIEW:
        return LoanWorkflowLevel.DISTRICT;
      case LoanStatus.HEAD_OFFICE_REVIEW:
        return LoanWorkflowLevel.HEAD_OFFICE;
      case LoanStatus.APPROVED:
      case LoanStatus.DISBURSED:
      case LoanStatus.CLOSED:
        return LoanWorkflowLevel.HEAD_OFFICE;
      case LoanStatus.REJECTED:
        return LoanWorkflowLevel.BRANCH;
      default:
        throw new BadRequestException('Unsupported demo loan status.');
    }
  }
}
