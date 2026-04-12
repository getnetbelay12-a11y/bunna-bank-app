import { BadRequestException, ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';

import { LoanStatus, UserRole } from '../../common/enums';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { DashboardPeriod, DashboardPeriodQueryDto } from './dto';
import {
  AutopayOperationItem,
  ManagerDashboardSummary,
  OnboardingEvidenceDetail,
  OnboardingReviewItem,
  PerformanceSummaryItem,
  StaffRankingItem,
  VotingSummaryItem,
} from './interfaces';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { SchoolPayment, SchoolPaymentDocument } from '../payments/schemas/school-payment.schema';
import { StaffPerformanceDaily, StaffPerformanceDailyDocument } from '../staff-activity/schemas/staff-performance-daily.schema';
import { StaffPerformanceWeekly, StaffPerformanceWeeklyDocument } from '../staff-activity/schemas/staff-performance-weekly.schema';
import { StaffPerformanceMonthly, StaffPerformanceMonthlyDocument } from '../staff-activity/schemas/staff-performance-monthly.schema';
import { StaffPerformanceYearly, StaffPerformanceYearlyDocument } from '../staff-activity/schemas/staff-performance-yearly.schema';
import { Vote, VoteDocument } from '../voting/schemas/vote.schema';
import { VoteResponse, VoteResponseDocument } from '../voting/schemas/vote-response.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { MemberProfileDocument, MemberProfileEntity } from '../member-profiles/schemas/member-profile.schema';
import { MemberType } from '../../common/enums';
import { UpdateAutopayOperationDto, UpdateOnboardingReviewDto } from './dto';
import { AutopaySetting, AutopaySettingDocument } from '../service-placeholders/schemas/autopay-setting.schema';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import {
  OnboardingEvidence,
  OnboardingEvidenceDocument,
} from '../auth/schemas/onboarding-evidence.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(SchoolPayment.name)
    private readonly schoolPaymentModel: Model<SchoolPaymentDocument>,
    @InjectModel(StaffPerformanceDaily.name)
    private readonly dailyPerformanceModel: Model<StaffPerformanceDailyDocument>,
    @InjectModel(StaffPerformanceWeekly.name)
    private readonly weeklyPerformanceModel: Model<StaffPerformanceWeeklyDocument>,
    @InjectModel(StaffPerformanceMonthly.name)
    private readonly monthlyPerformanceModel: Model<StaffPerformanceMonthlyDocument>,
    @InjectModel(StaffPerformanceYearly.name)
    private readonly yearlyPerformanceModel: Model<StaffPerformanceYearlyDocument>,
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteResponse.name)
    private readonly voteResponseModel: Model<VoteResponseDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(MemberProfileEntity.name)
    private readonly memberProfileModel: Model<MemberProfileDocument>,
    @InjectModel(OnboardingEvidence.name)
    private readonly onboardingEvidenceModel: Model<OnboardingEvidenceDocument>,
    @InjectModel(AutopaySetting.name)
    private readonly autopayModel: Model<AutopaySettingDocument>,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async getSummary(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<ManagerDashboardSummary> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    const [performance, schoolPayments, pendingLoans] = await Promise.all([
      performanceModel.aggregate<{
        customersServed: number;
        transactionsCount: number;
      }>([
        { $match: scope.performanceMatch },
        {
          $group: {
            _id: null,
            customersServed: { $sum: '$customersHelped' },
            transactionsCount: { $sum: '$transactionsCount' },
          },
        },
        { $project: { _id: 0, customersServed: 1, transactionsCount: 1 } },
      ]),
      this.schoolPaymentModel.countDocuments(scope.collectionMatch),
      this.loanModel.aggregate<{ level: string; count: number }>([
        {
          $match: {
            ...scope.collectionMatch,
            status: { $in: [LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW, LoanStatus.DISTRICT_REVIEW, LoanStatus.HEAD_OFFICE_REVIEW] },
          },
        },
        {
          $group: {
            _id: '$currentLevel',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            level: '$_id',
            count: 1,
          },
        },
      ]),
    ]);

    return {
      customersServed: performance[0]?.customersServed ?? 0,
      transactionsCount: performance[0]?.transactionsCount ?? 0,
      schoolPaymentsCount: schoolPayments,
      pendingLoansByLevel: pendingLoans,
    };
  }

  async getBranchPerformance(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceSummaryItem[]> {
    return this.getPerformanceByScope(currentUser, query, 'branchId');
  }

  async getDistrictPerformance(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<PerformanceSummaryItem[]> {
    return this.getPerformanceByScope(currentUser, query, 'districtId');
  }

  async getStaffRanking(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
  ): Promise<StaffRankingItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    return performanceModel.aggregate<StaffRankingItem>([
      { $match: scope.performanceMatch },
      {
        $project: {
          _id: 0,
          staffId: { $toString: '$staffId' },
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          customersServed: '$customersHelped',
          transactionsCount: 1,
          loanApprovedCount: 1,
          schoolPaymentsCount: 1,
          score: {
            $add: [
              '$customersHelped',
              '$transactionsCount',
              { $multiply: ['$loanApprovedCount', 3] },
              '$schoolPaymentsCount',
            ],
          },
        },
      },
      { $sort: { score: -1, loanApprovedCount: -1 } },
      { $limit: 10 },
    ]);
  }

  async getVotingSummary(
    currentUser: AuthenticatedUser,
  ): Promise<VotingSummaryItem[]> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const [votes, eligibleShareholders] = await Promise.all([
      this.voteModel.find({}).sort({ startDate: -1 }).lean<VoteDocument[]>(),
      this.memberModel.countDocuments({
        memberType: MemberType.SHAREHOLDER,
        ...scope,
      }),
    ]);

    return Promise.all(
      votes.map(async (vote) => {
        const totalResponses = await this.voteResponseModel.countDocuments({
          voteId: vote._id,
          ...scope,
        });

        return {
          voteId: vote._id.toString(),
          title: vote.title,
          totalResponses,
          eligibleShareholders,
          participationRate:
            eligibleShareholders === 0
              ? 0
              : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
        };
      }),
    );
  }

  async getOnboardingReviewQueue(
    currentUser: AuthenticatedUser,
  ): Promise<OnboardingReviewItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildManagerScope(currentUser);

    const items = await this.memberProfileModel.aggregate<OnboardingReviewItem>([
      {
        $match: {
          onboardingReviewStatus: {
            $in: ['submitted', 'review_in_progress', 'needs_action'],
          },
          ...scope,
        },
      },
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
        $lookup: {
          from: 'onboarding_evidence',
          localField: 'memberId',
          foreignField: 'memberId',
          as: 'evidence',
        },
      },
      {
        $unwind: {
          path: '$evidence',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          memberId: { $toString: '$member._id' },
          customerId: '$member.customerId',
          memberName: '$member.fullName',
          phoneNumber: '$member.phone',
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          branchName: '$member.preferredBranchName',
          onboardingReviewStatus: 1,
          membershipStatus: 1,
          identityVerificationStatus: 1,
          kycStatus: '$member.kycStatus',
          requiredAction: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$onboardingReviewStatus', 'needs_action'] },
                  then: 'Collect missing evidence',
                },
                {
                  case: { $eq: ['$identityVerificationStatus', 'qr_uploaded'] },
                  then: 'Validate Fayda QR evidence',
                },
                {
                  case: { $eq: ['$identityVerificationStatus', 'fin_submitted'] },
                  then: 'Validate Fayda FIN evidence',
                },
              ],
              default: 'Move case into active review',
            },
          },
          submittedAt: {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
          updatedAt: {
            $dateToString: {
              date: '$updatedAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
          reviewNote: '$onboardingReviewNote',
          onboardingEvidence: {
            hasFaydaFrontImage: {
              $cond: [{ $ifNull: ['$evidence.faydaFrontImage', false] }, true, false],
            },
            hasFaydaBackImage: {
              $cond: [{ $ifNull: ['$evidence.faydaBackImage', false] }, true, false],
            },
            hasSelfieImage: {
              $cond: [{ $ifNull: ['$evidence.selfieImage', false] }, true, false],
            },
            extractedFullName: '$evidence.extractedFaydaData.fullName',
            extractedPhoneNumber: '$evidence.extractedFaydaData.phoneNumber',
            extractedCity: '$evidence.extractedFaydaData.city',
            extractedFaydaFinMasked: '$evidence.extractedFaydaData.faydaFin',
            dateOfBirthCandidates: '$evidence.extractedFaydaData.dateOfBirthCandidates',
            reviewRequiredFields: '$evidence.extractedFaydaData.reviewRequiredFields',
            extractionMethod: '$evidence.extractedFaydaData.extractionMethod',
          },
        },
      },
      { $sort: { updatedAt: -1, submittedAt: -1 } },
    ]);

    return items.map((item) => this.maskOnboardingEvidence(item));
  }

  async updateOnboardingReview(
    currentUser: AuthenticatedUser,
    memberId: string,
    dto: UpdateOnboardingReviewDto,
  ): Promise<OnboardingReviewItem> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const profile = await this.memberProfileModel.findOne({
      memberId: new Types.ObjectId(memberId),
      ...scope,
    });

    if (!profile) {
      throw new NotFoundException('Onboarding review item was not found.');
    }

    const member = await this.memberModel.findById(memberId);
    if (!member) {
      throw new NotFoundException('Member was not found.');
    }

    const evidence = await this.onboardingEvidenceModel
      .findOne({ memberId: new Types.ObjectId(memberId) })
      .lean<OnboardingEvidenceDocument | null>();

    const submittedProfile = {
      fullName: member.fullName,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: this.toIsoDate(profile.dateOfBirth),
      phoneNumber: member.phone,
      region: member.region,
      city: member.city,
      branchName: member.preferredBranchName,
      faydaFinMasked: this.maskValue(member.faydaFin),
    };

    const extractedFaydaData = evidence?.extractedFaydaData
      ? {
          fullName: evidence.extractedFaydaData.fullName,
          firstName: evidence.extractedFaydaData.firstName,
          lastName: evidence.extractedFaydaData.lastName,
          dateOfBirth: evidence.extractedFaydaData.dateOfBirth,
          sex: evidence.extractedFaydaData.sex,
          phoneNumber: evidence.extractedFaydaData.phoneNumber,
          nationality: evidence.extractedFaydaData.nationality,
          region: evidence.extractedFaydaData.region,
          city: evidence.extractedFaydaData.city,
          subCity: evidence.extractedFaydaData.subCity,
          woreda: evidence.extractedFaydaData.woreda,
          faydaFinMasked: this.maskValue(evidence.extractedFaydaData.faydaFin),
          serialNumber: evidence.extractedFaydaData.serialNumber,
          cardNumber: evidence.extractedFaydaData.cardNumber,
          dateOfBirthCandidates:
            evidence.extractedFaydaData.dateOfBirthCandidates ?? [],
          expiryDateCandidates:
            evidence.extractedFaydaData.expiryDateCandidates ?? [],
          reviewRequiredFields:
            evidence.extractedFaydaData.reviewRequiredFields ?? [],
          extractionMethod: evidence.extractedFaydaData.extractionMethod,
        }
      : undefined;

    const mismatches = this.buildOnboardingMismatches(
      submittedProfile,
      extractedFaydaData,
    );
    const blockingMismatches = mismatches.filter((item) =>
      this.isBlockingOnboardingMismatch(item.field),
    );
    const previousReviewState = {
      onboardingReviewStatus: profile.onboardingReviewStatus,
      identityVerificationStatus: profile.identityVerificationStatus,
      membershipStatus: profile.membershipStatus,
      onboardingReviewNote: profile.onboardingReviewNote,
    };

    if (
      dto.supersessionReasonCode != null &&
      !this.isAllowedSupersessionReasonCode(dto.supersessionReasonCode)
    ) {
      throw new BadRequestException(
        `Supersession reason code is invalid. Allowed values: ${this.getSupersessionReasonCodes().join(', ')}.`,
      );
    }

    if (
      dto.status === 'approved' &&
      blockingMismatches.length > 0 &&
      !this.canApproveBlockingMismatch(currentUser.role)
    ) {
      throw new ForbiddenException(
        `Role ${currentUser.role} cannot approve blocking mismatches. Allowed roles: ${this.getBlockingMismatchApprovalRoles().join(', ')}.`,
      );
    }

    if (
      dto.status === 'approved' &&
      blockingMismatches.length > 0 &&
      !this.isAllowedApprovalReasonCode(dto.approvalReasonCode)
    ) {
      throw new BadRequestException(
        `Approval reason code is required for blocking mismatches. Allowed values: ${this.getBlockingMismatchApprovalReasonCodes().join(', ')}.`,
      );
    }

    if (
      dto.status === 'approved' &&
      this.requiresApprovalJustification() &&
      blockingMismatches.length > 0 &&
      !dto.approvalJustification?.trim()
    ) {
      throw new BadRequestException(
        `Approval justification is required for blocking mismatches: ${blockingMismatches
          .map((item) => item.field)
          .join(', ')}.`,
      );
    }

    const missingAcknowledgements = this.getMissingMismatchAcknowledgements(
      blockingMismatches.map((item) => item.field),
      dto.acknowledgedMismatchFields,
    );
    if (dto.status === 'approved' && missingAcknowledgements.length > 0) {
      throw new BadRequestException(
        `Each blocking mismatch must be acknowledged before approval: ${missingAcknowledgements.join(', ')}.`,
      );
    }

    let stepUpVerification:
      | {
          verifiedAt?: string;
          method?: string;
        }
      | undefined;
    if (dto.status === 'approved' && blockingMismatches.length > 0) {
      stepUpVerification = await this.authService.verifyHighRiskApprovalStepUpToken(
        currentUser,
        dto.stepUpToken,
        memberId,
      );
    }

    const [faydaFrontEvidence, faydaBackEvidence, selfieEvidence] = await Promise.all([
      this.resolveEvidenceReference(evidence?.faydaFrontImage),
      this.resolveEvidenceReference(evidence?.faydaBackImage),
      this.resolveEvidenceReference(evidence?.selfieImage),
    ]);

    const profileUpdates = this.resolveOnboardingProfileUpdates(dto);
    const memberKycStatus =
      dto.status === 'approved' ? 'verified' : 'pending';

    profile.membershipStatus = profileUpdates.membershipStatus;
    profile.identityVerificationStatus = profileUpdates.identityVerificationStatus;
    profile.onboardingReviewStatus = dto.status;
    profile.onboardingReviewNote = dto.note?.trim() || undefined;
    profile.onboardingReviewedBy = currentUser.sub;
    profile.onboardingLastReviewedAt = new Date();
    await profile.save();

    member.kycStatus = memberKycStatus;
    await member.save();

    await this.auditService.logOnboardingReviewDecision({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      entityId: memberId,
      before: previousReviewState,
      supersessionReasonCode: dto.supersessionReasonCode?.trim() || undefined,
      acknowledgedSupersessionFields: dto.acknowledgedSupersessionFields ?? [],
      after: {
        status: dto.status,
        note: dto.note?.trim() || undefined,
        approvalReasonCode: dto.approvalReasonCode?.trim() || undefined,
        approvalJustification: dto.approvalJustification?.trim() || undefined,
        acknowledgedMismatchFields: dto.acknowledgedMismatchFields ?? [],
        evidenceReferences: {
          faydaFrontStorageKey: faydaFrontEvidence?.storageKey,
          faydaFrontSha256Hash: faydaFrontEvidence?.sha256Hash,
          faydaBackStorageKey: faydaBackEvidence?.storageKey,
          faydaBackSha256Hash: faydaBackEvidence?.sha256Hash,
          selfieStorageKey: selfieEvidence?.storageKey,
          selfieSha256Hash: selfieEvidence?.sha256Hash,
          extractionMethod: evidence?.extractedFaydaData?.extractionMethod,
        },
        blockingMismatchFields: blockingMismatches.map((item) => item.field),
        allMismatchFields: mismatches.map((item) => item.field),
        reviewPolicySnapshot: {
          policyVersion: this.getReviewPolicyVersion(),
          blockingMismatchFields: this.getBlockingMismatchFields(),
          blockingMismatchApprovalRoles: this.getBlockingMismatchApprovalRoles(),
          blockingMismatchApprovalReasonCodes:
            this.getBlockingMismatchApprovalReasonCodes(),
          requireApprovalJustification: this.requiresApprovalJustification(),
        },
        stepUpVerification,
      },
    });

    const [item] = await this.memberProfileModel.aggregate<OnboardingReviewItem>([
      {
        $match: {
          memberId: new Types.ObjectId(memberId),
        },
      },
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
        $lookup: {
          from: 'onboarding_evidence',
          localField: 'memberId',
          foreignField: 'memberId',
          as: 'evidence',
        },
      },
      {
        $unwind: {
          path: '$evidence',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          memberId: { $toString: '$member._id' },
          customerId: '$member.customerId',
          memberName: '$member.fullName',
          phoneNumber: '$member.phone',
          branchId: { $toString: '$branchId' },
          districtId: { $toString: '$districtId' },
          branchName: '$member.preferredBranchName',
          onboardingReviewStatus: 1,
          membershipStatus: 1,
          identityVerificationStatus: 1,
          kycStatus: '$member.kycStatus',
          requiredAction: {
            $cond: {
              if: { $eq: ['$onboardingReviewStatus', 'approved'] },
              then: 'Customer can access verified services',
              else: 'Continue onboarding review',
            },
          },
          submittedAt: {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
          updatedAt: {
            $dateToString: {
              date: '$updatedAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
          reviewNote: '$onboardingReviewNote',
          onboardingEvidence: {
            hasFaydaFrontImage: {
              $cond: [{ $ifNull: ['$evidence.faydaFrontImage', false] }, true, false],
            },
            hasFaydaBackImage: {
              $cond: [{ $ifNull: ['$evidence.faydaBackImage', false] }, true, false],
            },
            hasSelfieImage: {
              $cond: [{ $ifNull: ['$evidence.selfieImage', false] }, true, false],
            },
            extractedFullName: '$evidence.extractedFaydaData.fullName',
            extractedPhoneNumber: '$evidence.extractedFaydaData.phoneNumber',
            extractedCity: '$evidence.extractedFaydaData.city',
            extractedFaydaFinMasked: '$evidence.extractedFaydaData.faydaFin',
            dateOfBirthCandidates: '$evidence.extractedFaydaData.dateOfBirthCandidates',
            reviewRequiredFields: '$evidence.extractedFaydaData.reviewRequiredFields',
            extractionMethod: '$evidence.extractedFaydaData.extractionMethod',
          },
        },
      },
    ]);

    if (!item) {
      throw new NotFoundException('Updated onboarding review item was not found.');
    }

    return this.maskOnboardingEvidence(item);
  }

  async getOnboardingEvidenceDetail(
    currentUser: AuthenticatedUser,
    memberId: string,
  ): Promise<OnboardingEvidenceDetail> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const profile = await this.memberProfileModel.findOne({
      memberId: new Types.ObjectId(memberId),
      ...scope,
    });

    if (!profile) {
      throw new NotFoundException('Onboarding review item was not found.');
    }

    const member = await this.memberModel.findById(memberId).lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Member was not found.');
    }

    const evidence = await this.onboardingEvidenceModel
      .findOne({ memberId: new Types.ObjectId(memberId) })
      .lean<OnboardingEvidenceDocument | null>();

    const [faydaFront, faydaBack, selfie] = await Promise.all([
      this.resolveDocumentDetail(evidence?.faydaFrontImage),
      this.resolveDocumentDetail(evidence?.faydaBackImage),
      this.resolveDocumentDetail(evidence?.selfieImage),
    ]);

    const submittedProfile = {
      fullName: member.fullName,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: this.toIsoDate(profile.dateOfBirth),
      phoneNumber: member.phone,
      region: member.region,
      city: member.city,
      branchName: member.preferredBranchName,
      faydaFinMasked: this.maskValue(member.faydaFin),
    };

    const extractedFaydaData = evidence?.extractedFaydaData
      ? {
          fullName: evidence.extractedFaydaData.fullName,
          firstName: evidence.extractedFaydaData.firstName,
          lastName: evidence.extractedFaydaData.lastName,
          dateOfBirth: evidence.extractedFaydaData.dateOfBirth,
          sex: evidence.extractedFaydaData.sex,
          phoneNumber: evidence.extractedFaydaData.phoneNumber,
          nationality: evidence.extractedFaydaData.nationality,
          region: evidence.extractedFaydaData.region,
          city: evidence.extractedFaydaData.city,
          subCity: evidence.extractedFaydaData.subCity,
          woreda: evidence.extractedFaydaData.woreda,
          faydaFinMasked: this.maskValue(evidence.extractedFaydaData.faydaFin),
          serialNumber: evidence.extractedFaydaData.serialNumber,
          cardNumber: evidence.extractedFaydaData.cardNumber,
          dateOfBirthCandidates:
            evidence.extractedFaydaData.dateOfBirthCandidates ?? [],
          expiryDateCandidates:
            evidence.extractedFaydaData.expiryDateCandidates ?? [],
          reviewRequiredFields:
            evidence.extractedFaydaData.reviewRequiredFields ?? [],
          extractionMethod: evidence.extractedFaydaData.extractionMethod,
        }
      : undefined;

    return {
      memberId,
      customerId: member.customerId,
      memberName: member.fullName,
      phoneNumber: member.phone,
      branchName: member.preferredBranchName,
      onboardingReviewStatus: profile.onboardingReviewStatus,
      identityVerificationStatus: profile.identityVerificationStatus,
      reviewNote: profile.onboardingReviewNote,
      documents: {
        faydaFront,
        faydaBack,
        selfie,
      },
      submittedProfile,
      reviewPolicy: {
        policyVersion: this.getReviewPolicyVersion(),
        blockingMismatchFields: this.getBlockingMismatchFields(),
        blockingMismatchApprovalRoles: this.getBlockingMismatchApprovalRoles(),
        blockingMismatchApprovalReasonCodes:
          this.getBlockingMismatchApprovalReasonCodes(),
        requireApprovalJustification: this.requiresApprovalJustification(),
      },
      extractedFaydaData,
      mismatches: this.buildOnboardingMismatches(submittedProfile, extractedFaydaData),
    };
  }

  private maskOnboardingEvidence(item: OnboardingReviewItem): OnboardingReviewItem {
    const evidence = item.onboardingEvidence;
    if (!evidence?.extractedFaydaFinMasked) {
      return {
        ...item,
        onboardingEvidence: evidence
          ? {
              ...evidence,
              dateOfBirthCandidates: evidence.dateOfBirthCandidates ?? [],
              reviewRequiredFields: evidence.reviewRequiredFields ?? [],
            }
          : evidence,
      };
    }

    const raw = evidence.extractedFaydaFinMasked;
    const masked =
      raw.length <= 4 ? '*'.repeat(raw.length) : `${'*'.repeat(raw.length - 4)}${raw.slice(-4)}`;

    return {
      ...item,
      onboardingEvidence: {
        ...evidence,
        extractedFaydaFinMasked: masked,
        dateOfBirthCandidates: evidence.dateOfBirthCandidates ?? [],
        reviewRequiredFields: evidence.reviewRequiredFields ?? [],
      },
    };
  }

  private async resolveDocumentDetail(storageKey?: string) {
    if (!storageKey) {
      return undefined;
    }

    const metadata = await this.storageService.getStoredDocumentMetadata(storageKey);
    return {
      storageKey,
      originalFileName: metadata.originalFileName,
      mimeType: metadata.mimeType,
      sizeBytes: metadata.sizeBytes,
    };
  }

  private async resolveEvidenceReference(storageKey?: string) {
    if (!storageKey) {
      return undefined;
    }

    const metadata = await this.storageService.getStoredDocumentMetadata(storageKey);
    return {
      storageKey,
      sha256Hash: metadata.sha256Hash,
    };
  }

  private maskValue(value?: string) {
    if (!value) {
      return undefined;
    }

    return value.length <= 4
      ? '*'.repeat(value.length)
      : `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }

  private toIsoDate(value?: Date) {
    if (!value) {
      return undefined;
    }

    return value.toISOString().slice(0, 10);
  }

  private buildOnboardingMismatches(
    submitted: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      phoneNumber?: string;
      region?: string;
      city?: string;
      branchName?: string;
      faydaFinMasked?: string;
    },
    extracted?: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      phoneNumber?: string;
      region?: string;
      city?: string;
      faydaFinMasked?: string;
    },
  ) {
    if (!extracted) {
      return [];
    }

    const comparisons = [
      ['fullName', submitted.fullName, extracted.fullName],
      ['firstName', submitted.firstName, extracted.firstName],
      ['lastName', submitted.lastName, extracted.lastName],
      ['dateOfBirth', submitted.dateOfBirth, extracted.dateOfBirth],
      ['phoneNumber', submitted.phoneNumber, extracted.phoneNumber],
      ['region', submitted.region, extracted.region],
      ['city', submitted.city, extracted.city],
      ['faydaFin', submitted.faydaFinMasked, extracted.faydaFinMasked],
    ] as const;

    return comparisons
      .filter(([, submittedValue, extractedValue]) =>
        this.normalizedCompareValue(submittedValue) !==
        this.normalizedCompareValue(extractedValue),
      )
      .map(([field, submittedValue, extractedValue]) => ({
        field,
        submittedValue,
        extractedValue,
      }));
  }

  private normalizedCompareValue(value?: string) {
    return value?.trim().toLowerCase() ?? '';
  }

  private isBlockingOnboardingMismatch(field: string) {
    return this.getBlockingMismatchFields().includes(field);
  }

  private getBlockingMismatchFields() {
    return this.configService.get<string[]>('onboarding.blockingMismatchFields') ?? [
      'fullName',
      'firstName',
      'lastName',
      'dateOfBirth',
      'phoneNumber',
      'faydaFin',
    ];
  }

  private getReviewPolicyVersion() {
    return this.configService.get<string>('onboarding.policyVersion') ?? 'v1';
  }

  private getBlockingMismatchApprovalRoles() {
    return this.configService.get<string[]>(
      'onboarding.blockingMismatchApprovalRoles',
    ) ?? ['head_office_manager', 'admin'];
  }

  private canApproveBlockingMismatch(role: string) {
    return this.getBlockingMismatchApprovalRoles().includes(role);
  }

  private getBlockingMismatchApprovalReasonCodes() {
    return this.configService.get<string[]>(
      'onboarding.blockingMismatchApprovalReasonCodes',
    ) ?? ['official_source_verified', 'manual_document_review', 'customer_profile_corrected'];
  }

  private isAllowedApprovalReasonCode(reasonCode?: string) {
    return Boolean(
      reasonCode?.trim() &&
        this.getBlockingMismatchApprovalReasonCodes().includes(reasonCode.trim()),
    );
  }

  private getMissingMismatchAcknowledgements(
    blockingMismatchFields: string[],
    acknowledgedMismatchFields?: string[],
  ) {
    const acknowledged = new Set(
      (acknowledgedMismatchFields ?? []).map((field) => field.trim()).filter(Boolean),
    );
    return blockingMismatchFields.filter((field) => !acknowledged.has(field));
  }

  private requiresApprovalJustification() {
    return (
      this.configService.get<boolean>('onboarding.requireApprovalJustification') ??
      true
    );
  }

  private getSupersessionReasonCodes() {
    return (
      this.configService.get<string[]>('onboarding.supersessionReasonCodes') ?? [
        'review_progressed',
        'customer_update_requested',
        'approval_recorded',
        'decision_corrected',
      ]
    );
  }

  private isAllowedSupersessionReasonCode(reasonCode?: string) {
    return Boolean(
      reasonCode?.trim() &&
        this.getSupersessionReasonCodes().includes(reasonCode.trim()),
    );
  }

  private async getPerformanceByScope(
    currentUser: AuthenticatedUser,
    query: DashboardPeriodQueryDto,
    field: 'branchId' | 'districtId',
  ): Promise<PerformanceSummaryItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildScope(currentUser, query);
    const performanceModel = this.resolvePerformanceModel(query.period ?? DashboardPeriod.TODAY);

    return performanceModel.aggregate<PerformanceSummaryItem>([
      { $match: scope.performanceMatch },
      {
        $group: {
          _id: `$${field}`,
          customersServed: { $sum: '$customersHelped' },
          transactionsCount: { $sum: '$transactionsCount' },
          loanApprovedCount: { $sum: '$loanApprovedCount' },
          loanRejectedCount: { $sum: '$loanRejectedCount' },
          schoolPaymentsCount: { $sum: '$schoolPaymentsCount' },
          totalTransactionAmount: { $sum: '$totalTransactionAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          scopeId: { $toString: '$_id' },
          customersServed: 1,
          transactionsCount: 1,
          loanApprovedCount: 1,
          loanRejectedCount: 1,
          schoolPaymentsCount: 1,
          totalTransactionAmount: 1,
        },
      },
      { $sort: { totalTransactionAmount: -1 } },
    ]);
  }

  private buildScope(currentUser: AuthenticatedUser, query: DashboardPeriodQueryDto) {
    const periodStart = this.resolvePeriodStart(query.period ?? DashboardPeriod.TODAY, query.date ? new Date(query.date) : new Date());
    const collectionMatch: Record<string, unknown> = {
      createdAt: { $gte: periodStart },
    };
    const performanceMatch: Record<string, unknown> = {
      periodStart,
    };

    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      collectionMatch.branchId = new Types.ObjectId(currentUser.branchId);
      performanceMatch.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      collectionMatch.districtId = new Types.ObjectId(currentUser.districtId);
      performanceMatch.districtId = new Types.ObjectId(currentUser.districtId);
    }

    return { collectionMatch, performanceMatch };
  }

  private buildManagerScope(currentUser: AuthenticatedUser) {
    const scope: Record<string, unknown> = {};

    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      scope.branchId = new Types.ObjectId(currentUser.branchId);
    }

    if (
      [UserRole.DISTRICT_OFFICER, UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      scope.districtId = new Types.ObjectId(currentUser.districtId);
    }

    return scope;
  }

  private resolvePerformanceModel(period: DashboardPeriod) {
    switch (period) {
      case DashboardPeriod.TODAY:
        return this.dailyPerformanceModel;
      case DashboardPeriod.WEEK:
        return this.weeklyPerformanceModel;
      case DashboardPeriod.MONTH:
        return this.monthlyPerformanceModel;
      case DashboardPeriod.YEAR:
        return this.yearlyPerformanceModel;
    }
  }

  private resolveOnboardingProfileUpdates(dto: UpdateOnboardingReviewDto) {
    switch (dto.status) {
      case 'approved':
        return {
          membershipStatus: 'active',
          identityVerificationStatus: 'verified',
        };
      case 'needs_action':
        return {
          membershipStatus: 'pending_verification',
          identityVerificationStatus: 'needs_action',
        };
      case 'review_in_progress':
        return {
          membershipStatus: 'pending_review',
          identityVerificationStatus: 'pending_review',
        };
      case 'submitted':
      default:
        return {
          membershipStatus: 'pending_verification',
          identityVerificationStatus: 'submitted',
        };
    }
  }

  async getAutopayOperations(
    currentUser: AuthenticatedUser,
  ): Promise<AutopayOperationItem[]> {
    this.ensureManagerAccess(currentUser);
    const scope = this.buildManagerScope(currentUser);

    return this.autopayModel.aggregate<AutopayOperationItem>([
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
        $match: {
          ...(scope.branchId ? { 'member.branchId': scope.branchId } : {}),
          ...(scope.districtId ? { 'member.districtId': scope.districtId } : {}),
        },
      },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          memberId: { $toString: '$member._id' },
          customerId: '$member.customerId',
          memberName: '$member.fullName',
          branchId: { $toString: '$member.branchId' },
          districtId: { $toString: '$member.districtId' },
          branchName: '$member.preferredBranchName',
          serviceType: 1,
          accountId: 1,
          schedule: 1,
          enabled: 1,
          operationalStatus: {
            $cond: [{ $eq: ['$enabled', true] }, 'active', 'paused'],
          },
          actionRequired: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$enabled', false] },
                  then: 'Review paused standing instruction and contact the member if retries are needed.',
                },
                {
                  case: { $eq: ['$serviceType', 'school_payment'] },
                  then: 'Monitor recurring school fee deductions and exception reminders closely.',
                },
                {
                  case: { $eq: ['$serviceType', 'rent'] },
                  then: 'Confirm monthly rent standing instruction remains funded before due date.',
                },
              ],
              default: 'Track recurring payment health and follow up on any failed reminders.',
            },
          },
          updatedAt: {
            $dateToString: {
              date: '$updatedAt',
              format: '%Y-%m-%dT%H:%M:%S.%LZ',
            },
          },
        },
      },
      { $sort: { enabled: 1, serviceType: 1, updatedAt: -1 } },
    ]);
  }

  async updateAutopayOperation(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateAutopayOperationDto,
  ): Promise<AutopayOperationItem> {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildManagerScope(currentUser);
    const item = await this.autopayModel.findById(id);
    if (!item) {
      throw new NotFoundException('Autopay setting not found.');
    }

    const member = await this.memberModel
      .findById(item.memberId)
      .lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Linked member not found.');
    }

    if (scope.branchId && member.branchId.toString() !== scope.branchId.toString()) {
      throw new ForbiddenException('Autopay setting is outside the current branch scope.');
    }

    if (scope.districtId && member.districtId.toString() !== scope.districtId.toString()) {
      throw new ForbiddenException('Autopay setting is outside the current district scope.');
    }

    const before = {
      enabled: item.enabled,
      serviceType: item.serviceType,
      schedule: item.schedule,
      accountId: item.accountId,
    };

    item.enabled = dto.enabled;
    await item.save();

    await this.auditService.log({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: dto.enabled ? 'autopay_reenabled_by_manager' : 'autopay_paused_by_manager',
      entityType: 'autopay_setting',
      entityId: item._id.toString(),
      before,
      after: {
        ...before,
        enabled: item.enabled,
        note: dto.note ?? null,
      },
    });

    return {
      id: item._id.toString(),
      memberId: member._id.toString(),
      customerId: member.customerId,
      memberName: member.fullName,
      branchId: member.branchId?.toString(),
      districtId: member.districtId?.toString(),
      branchName: member.preferredBranchName,
      serviceType: item.serviceType,
      accountId: item.accountId,
      schedule: item.schedule,
      enabled: item.enabled,
      operationalStatus: item.enabled ? 'active' : 'paused',
      actionRequired: item.enabled
        ? 'Track recurring payment health and follow up on any failed reminders.'
        : 'Review paused standing instruction and contact the member if retries are needed.',
      updatedAt: new Date().toISOString(),
    };
  }

  private resolvePeriodStart(period: DashboardPeriod, date: Date): Date {
    const base = new Date(date);
    base.setHours(0, 0, 0, 0);

    switch (period) {
      case DashboardPeriod.TODAY:
        return base;
      case DashboardPeriod.WEEK: {
        const day = base.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        base.setDate(base.getDate() + diff);
        return base;
      }
      case DashboardPeriod.MONTH:
        base.setDate(1);
        return base;
      case DashboardPeriod.YEAR:
        base.setMonth(0, 1);
        return base;
    }
  }

  private ensureManagerAccess(currentUser: AuthenticatedUser): void {
    if (
      ![
        UserRole.BRANCH_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.DISTRICT_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only manager and admin roles can access dashboard data.');
    }
  }
}
