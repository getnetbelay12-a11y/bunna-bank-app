import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LoanStatus,
  MemberType,
  NotificationCampaignStatus,
  NotificationCategory,
  UserRole,
  VoteStatus,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ChatConversation, ChatConversationDocument } from '../chat/schemas/chat-conversation.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { MemberProfileDocument, MemberProfileEntity } from '../member-profiles/schemas/member-profile.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationCampaign, NotificationCampaignDocument } from '../notifications/schemas/notification-campaign.schema';
import { SavingsAccount, SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { Vote, VoteDocument } from '../voting/schemas/vote.schema';
import { DashboardPeriodQueryDto } from './dto';
import {
  BranchCommandCenterSummary,
  CommandCenterSupportOverview,
  DistrictCommandCenterSummary,
  GovernanceStatusSummary,
  HeadOfficeCommandCenterSummary,
} from './interfaces/command-center.interface';
import { ManagerPerformanceService } from './manager-performance.service';
import { RiskService } from './risk.service';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(ChatConversation.name)
    private readonly chatConversationModel: Model<ChatConversationDocument>,
    @InjectModel(MemberProfileEntity.name)
    private readonly memberProfileModel: Model<MemberProfileDocument>,
    @InjectModel(NotificationCampaign.name)
    private readonly notificationCampaignModel: Model<NotificationCampaignDocument>,
    private readonly managerPerformanceService: ManagerPerformanceService,
    private readonly riskService: RiskService,
  ) {}

  async getHeadOfficeSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<HeadOfficeCommandCenterSummary> {
    this.ensureHeadOfficeAccess(currentUser);

    const [totalCustomers, totalShareholders, savingsTotals, districtPerformance, supportOverview, governanceStatus, riskAlerts] =
      await Promise.all([
        this.memberModel.countDocuments({ memberType: MemberType.MEMBER }),
        this.memberModel.countDocuments({ memberType: MemberType.SHAREHOLDER }),
        this.savingsAccountModel.aggregate<{ totalSavings: number }>([
          { $match: { isActive: true } },
          { $group: { _id: null, totalSavings: { $sum: '$balance' } } },
        ]),
        this.managerPerformanceService.getHeadOfficeDistrictSummary(currentUser, query),
        this.buildSupportOverview({}),
        this.buildGovernanceStatus(),
        this.riskService.getRiskSummary(currentUser),
      ]);

    const loanAggregate = await this.aggregateLoanTotals({});

    return {
      totalCustomers,
      totalShareholders,
      totalSavings: savingsTotals[0]?.totalSavings ?? 0,
      totalLoans: loanAggregate.totalLoans,
      pendingApprovals: loanAggregate.pendingApprovals,
      riskAlerts,
      districtPerformance,
      supportOverview,
      governanceStatus,
    };
  }

  async getDistrictSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<DistrictCommandCenterSummary> {
    this.ensureDistrictAccess(currentUser);
    const districtId = currentUser.districtId ? new Types.ObjectId(currentUser.districtId) : undefined;
    const scope = districtId ? { districtId } : {};
    const [branchListOverview, branchRanking, supportMetrics, kycCompletion, loanApprovalsPerBranch] =
      await Promise.all([
        this.managerPerformanceService.getDistrictBranchSummary(currentUser, query),
        this.managerPerformanceService.getDistrictTopBranches(currentUser, query),
        this.buildSupportOverview(scope),
        this.buildKycCompletion(scope),
        this.aggregateLoanApprovalsPerBranch(scope),
      ]);

    return {
      branchList: branchListOverview.items,
      branchRanking,
      loanApprovalsPerBranch,
      kycCompletion,
      supportMetrics,
    };
  }

  async getBranchSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<BranchCommandCenterSummary> {
    this.ensureBranchAccess(currentUser);
    const branchId = currentUser.branchId ? new Types.ObjectId(currentUser.branchId) : undefined;
    const scope = branchId ? { branchId } : {};
    const [employeePerformance, loanAggregate, kycCompletion, supportOverview] = await Promise.all([
      this.managerPerformanceService.getBranchEmployeeSummary(currentUser, query),
      this.aggregateLoanTotals(scope),
      this.buildKycCompletion(scope),
      this.buildSupportOverview(scope),
    ]);

    return {
      employeePerformance,
      loansHandled: loanAggregate.totalLoans,
      kycCompleted: kycCompletion.completed,
      supportHandled: supportOverview.resolvedChats,
      pendingTasks: employeePerformance.kpis.pendingTasks,
    };
  }

  private async aggregateLoanTotals(
    scope: { branchId?: Types.ObjectId; districtId?: Types.ObjectId },
  ): Promise<{ totalLoans: number; pendingApprovals: number }> {
    const [totals] = await this.loanModel.aggregate<{ totalLoans: number; pendingApprovals: number }>([
      { $match: scope },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          pendingApprovals: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    [
                      LoanStatus.SUBMITTED,
                      LoanStatus.BRANCH_REVIEW,
                      LoanStatus.DISTRICT_REVIEW,
                      LoanStatus.HEAD_OFFICE_REVIEW,
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      totalLoans: totals?.totalLoans ?? 0,
      pendingApprovals: totals?.pendingApprovals ?? 0,
    };
  }

  private async buildSupportOverview(
    scope: { branchId?: Types.ObjectId; districtId?: Types.ObjectId },
  ): Promise<CommandCenterSupportOverview> {
    const [counts] = await this.chatConversationModel.aggregate<CommandCenterSupportOverview>([
      { $match: scope },
      {
        $group: {
          _id: null,
          openChats: {
            $sum: {
              $cond: [{ $in: ['$status', ['open', 'waiting_agent', 'waiting_customer']] }, 1, 0],
            },
          },
          assignedChats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0],
            },
          },
          resolvedChats: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
          escalatedChats: {
            $sum: {
              $cond: [{ $eq: ['$escalationFlag', true] }, 1, 0],
            },
          },
        },
      },
      { $project: { _id: 0, openChats: 1, assignedChats: 1, resolvedChats: 1, escalatedChats: 1 } },
    ]);

    return {
      openChats: counts?.openChats ?? 0,
      assignedChats: counts?.assignedChats ?? 0,
      resolvedChats: counts?.resolvedChats ?? 0,
      escalatedChats: counts?.escalatedChats ?? 0,
    };
  }

  private async buildGovernanceStatus(): Promise<GovernanceStatusSummary> {
    const [votes, announcements] = await Promise.all([
      this.voteModel.aggregate<{ activeVotes: number; draftVotes: number; publishedVotes: number }>([
        {
          $group: {
            _id: null,
            activeVotes: { $sum: { $cond: [{ $eq: ['$status', VoteStatus.OPEN] }, 1, 0] } },
            draftVotes: { $sum: { $cond: [{ $eq: ['$status', VoteStatus.DRAFT] }, 1, 0] } },
            publishedVotes: { $sum: { $cond: [{ $eq: ['$status', VoteStatus.PUBLISHED] }, 1, 0] } },
          },
        },
      ]),
      this.notificationCampaignModel.countDocuments({
        category: NotificationCategory.SHAREHOLDER,
        status: NotificationCampaignStatus.COMPLETED,
      }),
    ]);

    return {
      activeVotes: votes[0]?.activeVotes ?? 0,
      draftVotes: votes[0]?.draftVotes ?? 0,
      publishedVotes: votes[0]?.publishedVotes ?? 0,
      shareholderAnnouncements: announcements,
    };
  }

  private async buildKycCompletion(
    scope: { branchId?: Types.ObjectId; districtId?: Types.ObjectId },
  ): Promise<{
    completed: number;
    pendingReview: number;
    needsAction: number;
    completionRate: number;
  }> {
    const [counts] = await this.memberProfileModel.aggregate<{
      completed: number;
      pendingReview: number;
      needsAction: number;
    }>([
      { $match: scope },
      {
        $group: {
          _id: null,
          completed: {
            $sum: { $cond: [{ $eq: ['$onboardingReviewStatus', 'approved'] }, 1, 0] },
          },
          pendingReview: {
            $sum: {
              $cond: [{ $in: ['$onboardingReviewStatus', ['submitted', 'review_in_progress']] }, 1, 0],
            },
          },
          needsAction: {
            $sum: { $cond: [{ $eq: ['$onboardingReviewStatus', 'needs_action'] }, 1, 0] },
          },
        },
      },
    ]);

    const completed = counts?.completed ?? 0;
    const pendingReview = counts?.pendingReview ?? 0;
    const needsAction = counts?.needsAction ?? 0;
    const total = completed + pendingReview + needsAction;

    return {
      completed,
      pendingReview,
      needsAction,
      completionRate: total === 0 ? 0 : Number(((completed / total) * 100).toFixed(1)),
    };
  }

  private async aggregateLoanApprovalsPerBranch(
    scope: { districtId?: Types.ObjectId },
  ): Promise<Array<{ branchId: string; branchName: string; approvedCount: number }>> {
    return this.loanModel.aggregate([
      { $match: { ...scope, status: { $in: [LoanStatus.APPROVED, LoanStatus.DISBURSED] } } },
      {
        $group: {
          _id: '$branchId',
          approvedCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          branchId: { $toString: '$_id' },
          branchName: { $ifNull: ['$branch.name', 'Unknown Branch'] },
          approvedCount: 1,
        },
      },
      { $sort: { approvedCount: -1, branchName: 1 } },
    ]);
  }

  private ensureHeadOfficeAccess(currentUser: AuthenticatedUser): void {
    if (
      ![
        UserRole.ADMIN,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only head office roles can access this summary.');
    }
  }

  private ensureDistrictAccess(currentUser: AuthenticatedUser): void {
    if (
      ![
        UserRole.ADMIN,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.DISTRICT_MANAGER,
        UserRole.DISTRICT_OFFICER,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only district-capable roles can access this summary.');
    }
  }

  private ensureBranchAccess(currentUser: AuthenticatedUser): void {
    if (!currentUser) {
      throw new ForbiddenException('Authentication is required to access this summary.');
    }
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
      throw new ForbiddenException('Only branch-capable roles can access this summary.');
    }
  }
}
