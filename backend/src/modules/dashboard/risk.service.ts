import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LoanStatus,
  NotificationCampaignStatus,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ChatConversation, ChatConversationDocument } from '../chat/schemas/chat-conversation.schema';
import { MemberProfileDocument, MemberProfileEntity } from '../member-profiles/schemas/member-profile.schema';
import { NotificationCampaign, NotificationCampaignDocument } from '../notifications/schemas/notification-campaign.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { CommandCenterRiskSummary } from './interfaces/command-center.interface';

@Injectable()
export class RiskService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(MemberProfileEntity.name)
    private readonly memberProfileModel: Model<MemberProfileDocument>,
    @InjectModel(ChatConversation.name)
    private readonly chatConversationModel: Model<ChatConversationDocument>,
    @InjectModel(NotificationCampaign.name)
    private readonly notificationCampaignModel: Model<NotificationCampaignDocument>,
  ) {}

  async getRiskSummary(currentUser: AuthenticatedUser): Promise<CommandCenterRiskSummary> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildScope(currentUser);
    const [loanAlerts, kycAlerts, supportAlerts, notificationAlerts] = await Promise.all([
      this.loanModel.countDocuments({
        ...scope,
        $or: [
          { status: LoanStatus.NEEDS_MORE_INFO },
          { deficiencyReasons: { $exists: true, $ne: [] } },
        ],
      }),
      this.memberProfileModel.countDocuments({
        ...scope,
        onboardingReviewStatus: { $in: ['needs_action', 'review_in_progress'] },
      }),
      this.chatConversationModel.countDocuments({
        ...scope,
        $or: [{ escalationFlag: true }, { priority: 'high' }, { status: 'waiting_agent' }],
      }),
      this.notificationCampaignModel.countDocuments({
        status: NotificationCampaignStatus.FAILED,
      }),
    ]);

    return {
      totalAlerts: loanAlerts + kycAlerts + supportAlerts + notificationAlerts,
      loanAlerts,
      kycAlerts,
      supportAlerts,
      notificationAlerts,
    };
  }

  private buildScope(currentUser: AuthenticatedUser): {
    branchId?: Types.ObjectId;
    districtId?: Types.ObjectId;
  } {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { branchId: new Types.ObjectId(currentUser.branchId) };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return { districtId: new Types.ObjectId(currentUser.districtId) };
    }

    return {};
  }

  private ensureManagerAccess(currentUser: AuthenticatedUser): void {
    if (
      ![
        UserRole.ADMIN,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.DISTRICT_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.BRANCH_MANAGER,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only staff users can access risk data.');
    }
  }
}
