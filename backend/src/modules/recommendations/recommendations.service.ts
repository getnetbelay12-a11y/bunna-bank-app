import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { ChatConversation, ChatConversationDocument } from '../chat/schemas/chat-conversation.schema';
import {
  IdentityVerification,
  IdentityVerificationDocument,
} from '../identity-verification/schemas/identity-verification.schema';
import { InsurancePolicy, InsurancePolicyDocument } from '../insurance/schemas/insurance-policy.schema';
import { MemberProfileEntity, MemberProfileDocument } from '../member-profiles/schemas/member-profile.schema';
import { Branch, BranchDocument } from '../members/schemas/branch.schema';
import { District, DistrictDocument } from '../members/schemas/district.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema';
import { SavingsAccount, SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { AtmCardRequest, AtmCardRequestDocument } from '../service-placeholders/schemas/atm-card-request.schema';
import { AutopaySetting, AutopaySettingDocument } from '../service-placeholders/schemas/autopay-setting.schema';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { RecommendationActionDto } from './dto';
import {
  RecommendationCandidate,
  RecommendationContext,
  RecommendationScoringPort,
} from './interfaces';
import {
  RECOMMENDATION_THRESHOLDS,
  RecommendationAudience,
} from './recommendation.constants';
import { reconcileRecommendations } from './recommendation.reconciliation';
import { recommendationRules } from './recommendation.rules';
import { RecommendationAnalyticsService } from './recommendation-analytics.service';
import {
  Recommendation,
  RecommendationDocument,
} from './schemas/recommendation.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name)
    private readonly recommendationModel: Model<RecommendationDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(MemberProfileEntity.name)
    private readonly memberProfileModel: Model<MemberProfileDocument>,
    @InjectModel(IdentityVerification.name)
    private readonly identityVerificationModel: Model<IdentityVerificationDocument>,
    @InjectModel(SavingsAccount.name)
    private readonly savingsAccountModel: Model<SavingsAccountDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(InsurancePolicy.name)
    private readonly insurancePolicyModel: Model<InsurancePolicyDocument>,
    @InjectModel(AutopaySetting.name)
    private readonly autopaySettingModel: Model<AutopaySettingDocument>,
    @InjectModel(AtmCardRequest.name)
    private readonly atmCardRequestModel: Model<AtmCardRequestDocument>,
    @InjectModel(ChatConversation.name)
    private readonly chatConversationModel: Model<ChatConversationDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(District.name)
    private readonly districtModel: Model<DistrictDocument>,
    private readonly analyticsService: RecommendationAnalyticsService,
    @Inject('RecommendationScoringPort')
    private readonly recommendationScorer: RecommendationScoringPort,
  ) {}

  async getMyRecommendations(currentUser: AuthenticatedUser) {
    this.ensureMemberAccess(currentUser);
    return this.getRecommendationsForMember(currentUser.sub, 'customer', currentUser);
  }

  async getCustomerRecommendationsForStaff(
    currentUser: AuthenticatedUser,
    memberId: string,
  ) {
    this.ensureStaffAccess(currentUser);
    return this.getRecommendationsForMember(memberId, 'staff', currentUser);
  }

  async generateForMember(currentUser: AuthenticatedUser, memberId: string) {
    this.ensureStaffAccess(currentUser);
    return this.generateRecommendations(memberId);
  }

  async generateForAll(currentUser: AuthenticatedUser) {
    this.ensureStaffAccess(currentUser);

    const members = await this.memberModel.find({ isActive: true }).select('_id').lean();
    const generated = await Promise.all(
      members.map((member) => this.generateRecommendations(member._id.toString())),
    );

    return {
      generatedMembers: generated.length,
      recommendationsCreated: generated.reduce(
        (total, item) => total + item.createdCount,
        0,
      ),
      recommendationsUpdated: generated.reduce(
        (total, item) => total + item.updatedCount,
        0,
      ),
    };
  }

  async markViewed(currentUser: AuthenticatedUser, recommendationId: string) {
    const recommendation = await this.requireAccessibleRecommendation(
      currentUser,
      recommendationId,
    );

    if (recommendation.status === 'new') {
      recommendation.status = 'viewed';
      await recommendation.save();
    }

    await this.analyticsService.track({
      recommendationId,
      memberId: recommendation.memberId.toString(),
      customerId: recommendation.customerId,
      eventType: 'viewed',
      actorType: this.actorTypeForUser(currentUser),
      actorId: currentUser.sub,
    });

    return this.serializeRecommendation(recommendation, recommendation.audienceType);
  }

  async dismiss(
    currentUser: AuthenticatedUser,
    recommendationId: string,
  ) {
    const recommendation = await this.requireAccessibleRecommendation(
      currentUser,
      recommendationId,
    );

    recommendation.status = 'dismissed';
    await recommendation.save();

    await this.analyticsService.track({
      recommendationId,
      memberId: recommendation.memberId.toString(),
      customerId: recommendation.customerId,
      eventType: 'dismissed',
      actorType: this.actorTypeForUser(currentUser),
      actorId: currentUser.sub,
    });

    return { id: recommendationId, status: recommendation.status };
  }

  async act(
    currentUser: AuthenticatedUser,
    recommendationId: string,
    dto: RecommendationActionDto,
  ) {
    const recommendation = await this.requireAccessibleRecommendation(
      currentUser,
      recommendationId,
    );

    recommendation.status = 'acted_on';
    await recommendation.save();

    await this.analyticsService.track({
      recommendationId,
      memberId: recommendation.memberId.toString(),
      customerId: recommendation.customerId,
      eventType: dto.completed ? 'completed' : 'clicked',
      actorType: this.actorTypeForUser(currentUser),
      actorId: currentUser.sub,
      metadata: {
        actionRoute: recommendation.actionRoute,
      },
    });

    return {
      id: recommendationId,
      status: recommendation.status,
      actionRoute: recommendation.actionRoute,
    };
  }

  async getDashboardSummary(currentUser: AuthenticatedUser) {
    this.ensureStaffAccess(currentUser);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      generatedToday,
      topTypes,
      statusCounts,
      highOpportunityCustomers,
      customersMissingKyc,
      customersSuitableForAutopay,
    ] = await Promise.all([
      this.recommendationModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      this.recommendationModel.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      this.recommendationModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.recommendationModel.distinct('memberId', {
        status: { $in: ['new', 'viewed'] },
        audienceType: 'staff',
        type: { $in: ['product_recommendation', 'loan_topup', 'customer_followup'] },
        badge: { $in: ['High relevance', 'Opportunity'] },
      }),
      this.recommendationModel.distinct('memberId', {
        status: { $in: ['new', 'viewed'] },
        type: 'kyc_completion',
      }),
      this.recommendationModel.distinct('memberId', {
        status: { $in: ['new', 'viewed'] },
        type: 'autopay_recommendation',
      }),
    ]);

    const statusMap = new Map(statusCounts.map((item) => [item._id, item.count]));
    const activeCount =
      (statusMap.get('new') ?? 0) + (statusMap.get('viewed') ?? 0) + (statusMap.get('acted_on') ?? 0);
    const completionRate =
      activeCount === 0
        ? 0
        : Number((((statusMap.get('acted_on') ?? 0) / activeCount) * 100).toFixed(2));
    const dismissedRate =
      activeCount === 0
        ? 0
        : Number((((statusMap.get('dismissed') ?? 0) / activeCount) * 100).toFixed(2));

    return {
      recommendationsGeneratedToday: generatedToday,
      topRecommendationType: topTypes[0]?._id ?? null,
      completionRate,
      dismissedRate,
      highOpportunityCustomers: highOpportunityCustomers.length,
      customersMissingKyc: customersMissingKyc.length,
      customersSuitableForAutopay: customersSuitableForAutopay.length,
    };
  }

  private async getRecommendationsForMember(
    memberId: string,
    audience: RecommendationAudience,
    currentUser: AuthenticatedUser,
  ) {
    await this.generateRecommendations(memberId);

    const limit =
      audience === 'customer'
        ? RECOMMENDATION_THRESHOLDS.maxCustomerCards
        : RECOMMENDATION_THRESHOLDS.maxStaffCards;

    const recommendations = await this.recommendationModel
      .find({
        memberId: new Types.ObjectId(memberId),
        audienceType: audience,
        status: { $in: ['new', 'viewed'] },
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
      })
      .sort({ priority: -1, score: -1, createdAt: -1 })
      .limit(limit)
      .lean<RecommendationDocument[]>();

    await Promise.all(
      recommendations.map((recommendation) =>
        this.analyticsService.track({
          recommendationId: recommendation._id.toString(),
          memberId: recommendation.memberId.toString(),
          customerId: recommendation.customerId,
          eventType: 'shown',
          actorType: this.actorTypeForUser(currentUser),
          actorId: currentUser.sub,
          metadata: {
            audience,
          },
        }),
      ),
    );

    return {
      title: audience === 'customer' ? 'Recommended for You' : 'Smart Recommendations',
      recommendations: recommendations.map((item) =>
        this.serializeRecommendation(item, audience),
      ),
    };
  }

  private async generateRecommendations(memberId: string) {
    const context = await this.buildContext(memberId);
    const existing = await this.recommendationModel
      .find({ memberId: new Types.ObjectId(memberId) })
      .exec();

    const candidates = await this.buildCandidates(context);
    const plan = reconcileRecommendations(existing, candidates, context.now);

    if (plan.create.length > 0) {
      await this.recommendationModel.insertMany(
        plan.create.map((candidate) => ({
          memberId: candidate.memberId,
          customerId: candidate.customerId,
          audienceType: candidate.audienceType,
          type: candidate.type,
          title: candidate.title,
          description: candidate.description,
          reason: candidate.reason,
          actionLabel: candidate.actionLabel,
          actionRoute: candidate.actionRoute,
          score: candidate.score,
          priority: candidate.priority,
          badge: candidate.badge,
          source: candidate.source,
          status: 'new',
          branchId: candidate.branchId,
          districtId: candidate.districtId,
          fingerprint: candidate.fingerprint,
          metadata: candidate.metadata,
          expiresAt: candidate.expiresAt,
        })),
      );
    }

    await Promise.all([
      ...plan.update.map((item) =>
        this.recommendationModel.updateOne(
          { _id: new Types.ObjectId(item.existingId) },
          {
            $set: {
              title: item.candidate.title,
              description: item.candidate.description,
              reason: item.candidate.reason,
              actionLabel: item.candidate.actionLabel,
              actionRoute: item.candidate.actionRoute,
              score: item.candidate.score,
              priority: item.candidate.priority,
              badge: item.candidate.badge,
              metadata: item.candidate.metadata,
              expiresAt: item.candidate.expiresAt,
              status: item.status,
            },
          },
        ),
      ),
      ...(plan.expireIds.length > 0
        ? [
            this.recommendationModel.updateMany(
              { _id: { $in: plan.expireIds.map((id) => new Types.ObjectId(id)) } },
              { $set: { status: 'expired' } },
            ),
          ]
        : []),
    ]);

    return {
      createdCount: plan.create.length,
      updatedCount: plan.update.length,
      expiredCount: plan.expireIds.length,
    };
  }

  private async buildCandidates(
    context: RecommendationContext,
  ): Promise<RecommendationCandidate[]> {
    const drafts = recommendationRules.flatMap((rule) => rule.evaluate(context));
    const deduped = new Map<string, RecommendationCandidate>();

    for (const draft of drafts) {
      const fingerprint = [
        context.member.id,
        draft.audienceType,
        draft.type,
        draft.fingerprintSeed ?? draft.title,
        draft.actionRoute,
      ].join(':');

      const candidate: RecommendationCandidate = {
        ...draft,
        memberId: new Types.ObjectId(context.member.id),
        customerId: context.member.customerId,
        branchId: new Types.ObjectId(context.member.branchId),
        districtId: new Types.ObjectId(context.member.districtId),
        fingerprint,
      };

      const scored = await this.recommendationScorer.score(candidate, context);
      const finalCandidate = { ...candidate, ...scored };

      const existing = deduped.get(fingerprint);
      if (!existing || finalCandidate.priority > existing.priority) {
        deduped.set(fingerprint, finalCandidate);
      }
    }

    return Array.from(deduped.values());
  }

  private async buildContext(memberId: string): Promise<RecommendationContext> {
    const memberObjectId = new Types.ObjectId(memberId);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [member, profile, identityVerification, accounts, transactions, loans, insurancePolicies, autopaySettings, atmCardRequests, chats, notifications] =
      await Promise.all([
        this.memberModel.findById(memberObjectId).lean<MemberDocument | null>(),
        this.memberProfileModel
          .findOne({ memberId: memberObjectId })
          .lean<MemberProfileDocument | null>(),
        this.identityVerificationModel
          .findOne({ memberId: memberObjectId })
          .sort({ createdAt: -1 })
          .lean<IdentityVerificationDocument | null>(),
        this.savingsAccountModel
          .find({ memberId: memberObjectId, isActive: true })
          .lean<SavingsAccountDocument[]>(),
        this.transactionModel
          .find({ memberId: memberObjectId, createdAt: { $gte: ninetyDaysAgo } })
          .sort({ createdAt: -1 })
          .lean<TransactionDocument[]>(),
        this.loanModel
          .find({ memberId: memberObjectId })
          .sort({ createdAt: -1 })
          .lean<LoanDocument[]>(),
        this.insurancePolicyModel
          .find({ memberId: memberObjectId })
          .sort({ endDate: 1 })
          .lean<InsurancePolicyDocument[]>(),
        this.autopaySettingModel
          .find({ memberId: memberObjectId, enabled: true })
          .lean<AutopaySettingDocument[]>(),
        this.atmCardRequestModel
          .find({ memberId: memberObjectId })
          .lean<AtmCardRequestDocument[]>(),
        this.chatConversationModel
          .find({ memberId: memberObjectId, createdAt: { $gte: sixtyDaysAgo } })
          .lean<ChatConversationDocument[]>(),
        this.notificationModel
          .find({ userType: 'member', userId: memberObjectId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean<NotificationDocument[]>(),
      ]);

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const [branch, district] = await Promise.all([
      this.branchModel.findById(member.branchId).lean<BranchDocument | null>(),
      this.districtModel.findById(member.districtId).lean<DistrictDocument | null>(),
    ]);

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const depositTransactions = transactions.filter((tx) => tx.type === 'deposit');
    const depositMonths = new Set(
      depositTransactions.map((tx) => {
        const date = (tx as TransactionDocument & { createdAt?: Date }).createdAt ?? now;
        return `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      }),
    ).size;
    const branchTransactions = transactions.filter((tx) => tx.channel === 'branch');
    const manualPaymentCount = transactions.filter(
      (tx) =>
        tx.channel === 'branch' &&
        ['school_payment', 'loan_repayment', 'transfer'].includes(tx.type),
    ).length;
    const loanRepaymentCount = transactions.filter(
      (tx) => tx.type === 'loan_repayment',
    ).length;
    const activeLoans = loans.filter((loan) =>
      ['approved', 'disbursed', 'branch_review', 'district_review', 'head_office_review'].includes(
        loan.status,
      ),
    );
    const approvedOrDisbursedLoans = loans.filter((loan) =>
      ['approved', 'disbursed', 'closed'].includes(loan.status),
    );
    const nearestPolicy = insurancePolicies.find(
      (policy) => policy.endDate && policy.endDate >= now,
    );
    const unreadNotifications = notifications.some(
      (notification) => notification.status !== 'read',
    );
    const segment =
      totalBalance >= 150000 || member.shareBalance >= 200000
        ? 'premium'
        : transactions.length >= 5 || totalBalance >= 50000
          ? 'active'
          : 'mass';

    return {
      member: {
        id: member._id.toString(),
        customerId: member.customerId,
        fullName: member.fullName,
        firstName: member.firstName,
        branchId: member.branchId.toString(),
        districtId: member.districtId.toString(),
        branchName: branch?.name,
        districtName: district?.name,
        kycStatus: member.kycStatus,
        phone: member.phone,
        shareBalance: member.shareBalance,
      },
      profile: profile
        ? {
            membershipStatus: profile.membershipStatus,
            identityVerificationStatus: profile.identityVerificationStatus,
          }
        : null,
      identityVerification: identityVerification
        ? {
            verificationStatus: identityVerification.verificationStatus,
            verifiedAt: identityVerification.verifiedAt,
          }
        : null,
      savings: {
        accountsCount: accounts.length,
        totalBalance,
        averageBalance: accounts.length === 0 ? 0 : totalBalance / accounts.length,
        hasActiveSavings: accounts.length > 0,
      },
      transactions: {
        totalCount: transactions.length,
        mobileCount: transactions.filter((tx) => tx.channel === 'mobile').length,
        branchCount: branchTransactions.length,
        manualPaymentCount,
        loanRepaymentCount,
        depositCount: depositTransactions.length,
        depositMonths,
        averageDepositAmount:
          depositTransactions.length === 0
            ? 0
            : depositTransactions.reduce((sum, tx) => sum + tx.amount, 0) /
              depositTransactions.length,
      },
      loans: {
        totalCount: loans.length,
        activeCount: activeLoans.length,
        approvedOrDisbursedCount: approvedOrDisbursedLoans.length,
        closedCount: loans.filter((loan) => loan.status === 'closed').length,
        hasGoodRepaymentSignal:
          approvedOrDisbursedLoans.length > 0 &&
          loanRepaymentCount >= 2 &&
          chats.filter((chat) => chat.category === 'loan_issue' && chat.status !== 'resolved')
            .length === 0,
        hasRepaymentWithoutAutopay:
          activeLoans.length > 0 && loanRepaymentCount > 0 && autopaySettings.length === 0,
      },
      insurance: {
        activePoliciesCount: insurancePolicies.filter((policy) => policy.status === 'active')
          .length,
        expiringSoon: Boolean(
          nearestPolicy &&
            nearestPolicy.endDate.getTime() - now.getTime() <=
              RECOMMENDATION_THRESHOLDS.insuranceRenewalDays *
                24 *
                60 *
                60 *
                1000,
        ),
        nearestExpiryAt: nearestPolicy?.endDate,
      },
      services: {
        autopayEnabled: autopaySettings.length > 0,
        hasAtmCard: atmCardRequests.some((request) => request.status !== 'cancelled'),
        branchHeavyUsage:
          branchTransactions.length >=
            RECOMMENDATION_THRESHOLDS.digitalMigrationBranchTxnThreshold &&
          branchTransactions.length >
            transactions.filter((tx) => tx.channel === 'mobile').length,
        hasUnreadNotifications: unreadNotifications,
      },
      support: {
        recentOpenChats: chats.filter((chat) => ['open', 'assigned', 'waiting_agent', 'waiting_customer'].includes(chat.status))
          .length,
        recentChats: chats.length,
        needsFollowup:
          chats.length >= RECOMMENDATION_THRESHOLDS.supportFollowupChatThreshold ||
          chats.some((chat) => ['open', 'assigned', 'waiting_agent'].includes(chat.status)),
      },
      segment,
      now,
    };
  }

  private async requireAccessibleRecommendation(
    currentUser: AuthenticatedUser,
    recommendationId: string,
  ) {
    const recommendation = await this.recommendationModel.findById(recommendationId);

    if (!recommendation) {
      throw new NotFoundException('Recommendation not found.');
    }

    if (
      [UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role) &&
      (recommendation.memberId.toString() !== currentUser.sub ||
        recommendation.audienceType !== 'customer')
    ) {
      throw new ForbiddenException('You cannot access this recommendation.');
    }

    return recommendation;
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser) {
    if (![UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role)) {
      throw new ForbiddenException('Only members can access customer recommendations.');
    }
  }

  private ensureStaffAccess(currentUser: AuthenticatedUser) {
    if ([UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role)) {
      throw new ForbiddenException('Only staff can access this recommendation resource.');
    }
  }

  private actorTypeForUser(currentUser: AuthenticatedUser) {
    return [UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role)
      ? 'customer'
      : 'staff';
  }

  private serializeRecommendation(
    recommendation: RecommendationDocument,
    audience: RecommendationAudience,
  ) {
    const metadata = recommendation.metadata ?? {};

    return {
      id: recommendation._id.toString(),
      customerId: recommendation.customerId,
      audienceType: recommendation.audienceType,
      type: recommendation.type,
      title: recommendation.title,
      description: recommendation.description,
      reason: recommendation.reason,
      actionLabel: recommendation.actionLabel,
      actionRoute: recommendation.actionRoute,
      score: recommendation.score,
      priority: recommendation.priority,
      badge: recommendation.badge,
      source: recommendation.source,
      status: recommendation.status,
      metadata:
        audience === 'staff'
          ? metadata
          : {
              likelyEligible: metadata.likelyEligible,
            },
      createdAt: recommendation.createdAt,
      updatedAt: recommendation.updatedAt,
      expiresAt: recommendation.expiresAt,
    };
  }
}
