"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const storage_service_1 = require("../../common/storage/storage.service");
const dto_1 = require("./dto");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const school_payment_schema_1 = require("../payments/schemas/school-payment.schema");
const staff_performance_daily_schema_1 = require("../staff-activity/schemas/staff-performance-daily.schema");
const staff_performance_weekly_schema_1 = require("../staff-activity/schemas/staff-performance-weekly.schema");
const staff_performance_monthly_schema_1 = require("../staff-activity/schemas/staff-performance-monthly.schema");
const staff_performance_yearly_schema_1 = require("../staff-activity/schemas/staff-performance-yearly.schema");
const vote_schema_1 = require("../voting/schemas/vote.schema");
const vote_response_schema_1 = require("../voting/schemas/vote-response.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const member_profile_schema_1 = require("../member-profiles/schemas/member-profile.schema");
const enums_2 = require("../../common/enums");
const autopay_setting_schema_1 = require("../service-placeholders/schemas/autopay-setting.schema");
const audit_service_1 = require("../audit/audit.service");
const auth_service_1 = require("../auth/auth.service");
const onboarding_evidence_schema_1 = require("../auth/schemas/onboarding-evidence.schema");
let DashboardService = class DashboardService {
    constructor(loanModel, schoolPaymentModel, dailyPerformanceModel, weeklyPerformanceModel, monthlyPerformanceModel, yearlyPerformanceModel, voteModel, voteResponseModel, memberModel, memberProfileModel, onboardingEvidenceModel, autopayModel, authService, auditService, storageService, configService) {
        this.loanModel = loanModel;
        this.schoolPaymentModel = schoolPaymentModel;
        this.dailyPerformanceModel = dailyPerformanceModel;
        this.weeklyPerformanceModel = weeklyPerformanceModel;
        this.monthlyPerformanceModel = monthlyPerformanceModel;
        this.yearlyPerformanceModel = yearlyPerformanceModel;
        this.voteModel = voteModel;
        this.voteResponseModel = voteResponseModel;
        this.memberModel = memberModel;
        this.memberProfileModel = memberProfileModel;
        this.onboardingEvidenceModel = onboardingEvidenceModel;
        this.autopayModel = autopayModel;
        this.authService = authService;
        this.auditService = auditService;
        this.storageService = storageService;
        this.configService = configService;
    }
    async getSummary(currentUser, query) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        const [performance, schoolPayments, pendingLoans] = await Promise.all([
            performanceModel.aggregate([
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
            this.loanModel.aggregate([
                {
                    $match: {
                        ...scope.collectionMatch,
                        status: { $in: [enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW, enums_1.LoanStatus.DISTRICT_REVIEW, enums_1.LoanStatus.HEAD_OFFICE_REVIEW] },
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
    async getBranchPerformance(currentUser, query) {
        return this.getPerformanceByScope(currentUser, query, 'branchId');
    }
    async getDistrictPerformance(currentUser, query) {
        return this.getPerformanceByScope(currentUser, query, 'districtId');
    }
    async getStaffRanking(currentUser, query) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        return performanceModel.aggregate([
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
    async getVotingSummary(currentUser) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const [votes, eligibleShareholders] = await Promise.all([
            this.voteModel.find({}).sort({ startDate: -1 }).lean(),
            this.memberModel.countDocuments({
                memberType: enums_2.MemberType.SHAREHOLDER,
                ...scope,
            }),
        ]);
        return Promise.all(votes.map(async (vote) => {
            const totalResponses = await this.voteResponseModel.countDocuments({
                voteId: vote._id,
                ...scope,
            });
            return {
                voteId: vote._id.toString(),
                title: vote.title,
                totalResponses,
                eligibleShareholders,
                participationRate: eligibleShareholders === 0
                    ? 0
                    : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
            };
        }));
    }
    async getOnboardingReviewQueue(currentUser) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const items = await this.memberProfileModel.aggregate([
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
    async updateOnboardingReview(currentUser, memberId, dto) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const profile = await this.memberProfileModel.findOne({
            memberId: new mongoose_2.Types.ObjectId(memberId),
            ...scope,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Onboarding review item was not found.');
        }
        const member = await this.memberModel.findById(memberId);
        if (!member) {
            throw new common_1.NotFoundException('Member was not found.');
        }
        const evidence = await this.onboardingEvidenceModel
            .findOne({ memberId: new mongoose_2.Types.ObjectId(memberId) })
            .lean();
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
                dateOfBirthCandidates: evidence.extractedFaydaData.dateOfBirthCandidates ?? [],
                expiryDateCandidates: evidence.extractedFaydaData.expiryDateCandidates ?? [],
                reviewRequiredFields: evidence.extractedFaydaData.reviewRequiredFields ?? [],
                extractionMethod: evidence.extractedFaydaData.extractionMethod,
            }
            : undefined;
        const mismatches = this.buildOnboardingMismatches(submittedProfile, extractedFaydaData);
        const blockingMismatches = mismatches.filter((item) => this.isBlockingOnboardingMismatch(item.field));
        const previousReviewState = {
            onboardingReviewStatus: profile.onboardingReviewStatus,
            identityVerificationStatus: profile.identityVerificationStatus,
            membershipStatus: profile.membershipStatus,
            onboardingReviewNote: profile.onboardingReviewNote,
        };
        if (dto.supersessionReasonCode != null &&
            !this.isAllowedSupersessionReasonCode(dto.supersessionReasonCode)) {
            throw new common_1.BadRequestException(`Supersession reason code is invalid. Allowed values: ${this.getSupersessionReasonCodes().join(', ')}.`);
        }
        if (dto.status === 'approved' &&
            blockingMismatches.length > 0 &&
            !this.canApproveBlockingMismatch(currentUser.role)) {
            throw new common_1.ForbiddenException(`Role ${currentUser.role} cannot approve blocking mismatches. Allowed roles: ${this.getBlockingMismatchApprovalRoles().join(', ')}.`);
        }
        if (dto.status === 'approved' &&
            blockingMismatches.length > 0 &&
            !this.isAllowedApprovalReasonCode(dto.approvalReasonCode)) {
            throw new common_1.BadRequestException(`Approval reason code is required for blocking mismatches. Allowed values: ${this.getBlockingMismatchApprovalReasonCodes().join(', ')}.`);
        }
        if (dto.status === 'approved' &&
            this.requiresApprovalJustification() &&
            blockingMismatches.length > 0 &&
            !dto.approvalJustification?.trim()) {
            throw new common_1.BadRequestException(`Approval justification is required for blocking mismatches: ${blockingMismatches
                .map((item) => item.field)
                .join(', ')}.`);
        }
        const missingAcknowledgements = this.getMissingMismatchAcknowledgements(blockingMismatches.map((item) => item.field), dto.acknowledgedMismatchFields);
        if (dto.status === 'approved' && missingAcknowledgements.length > 0) {
            throw new common_1.BadRequestException(`Each blocking mismatch must be acknowledged before approval: ${missingAcknowledgements.join(', ')}.`);
        }
        let stepUpVerification;
        if (dto.status === 'approved' && blockingMismatches.length > 0) {
            stepUpVerification = await this.authService.verifyHighRiskApprovalStepUpToken(currentUser, dto.stepUpToken, memberId);
        }
        const [faydaFrontEvidence, faydaBackEvidence, selfieEvidence] = await Promise.all([
            this.resolveEvidenceReference(evidence?.faydaFrontImage),
            this.resolveEvidenceReference(evidence?.faydaBackImage),
            this.resolveEvidenceReference(evidence?.selfieImage),
        ]);
        const profileUpdates = this.resolveOnboardingProfileUpdates(dto);
        const memberKycStatus = dto.status === 'approved' ? 'verified' : 'pending';
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
                    blockingMismatchApprovalReasonCodes: this.getBlockingMismatchApprovalReasonCodes(),
                    requireApprovalJustification: this.requiresApprovalJustification(),
                },
                stepUpVerification,
            },
        });
        const [item] = await this.memberProfileModel.aggregate([
            {
                $match: {
                    memberId: new mongoose_2.Types.ObjectId(memberId),
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
            throw new common_1.NotFoundException('Updated onboarding review item was not found.');
        }
        return this.maskOnboardingEvidence(item);
    }
    async getOnboardingEvidenceDetail(currentUser, memberId) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const profile = await this.memberProfileModel.findOne({
            memberId: new mongoose_2.Types.ObjectId(memberId),
            ...scope,
        });
        if (!profile) {
            throw new common_1.NotFoundException('Onboarding review item was not found.');
        }
        const member = await this.memberModel.findById(memberId).lean();
        if (!member) {
            throw new common_1.NotFoundException('Member was not found.');
        }
        const evidence = await this.onboardingEvidenceModel
            .findOne({ memberId: new mongoose_2.Types.ObjectId(memberId) })
            .lean();
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
                dateOfBirthCandidates: evidence.extractedFaydaData.dateOfBirthCandidates ?? [],
                expiryDateCandidates: evidence.extractedFaydaData.expiryDateCandidates ?? [],
                reviewRequiredFields: evidence.extractedFaydaData.reviewRequiredFields ?? [],
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
                blockingMismatchApprovalReasonCodes: this.getBlockingMismatchApprovalReasonCodes(),
                requireApprovalJustification: this.requiresApprovalJustification(),
            },
            extractedFaydaData,
            mismatches: this.buildOnboardingMismatches(submittedProfile, extractedFaydaData),
        };
    }
    maskOnboardingEvidence(item) {
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
        const masked = raw.length <= 4 ? '*'.repeat(raw.length) : `${'*'.repeat(raw.length - 4)}${raw.slice(-4)}`;
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
    async resolveDocumentDetail(storageKey) {
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
    async resolveEvidenceReference(storageKey) {
        if (!storageKey) {
            return undefined;
        }
        const metadata = await this.storageService.getStoredDocumentMetadata(storageKey);
        return {
            storageKey,
            sha256Hash: metadata.sha256Hash,
        };
    }
    maskValue(value) {
        if (!value) {
            return undefined;
        }
        return value.length <= 4
            ? '*'.repeat(value.length)
            : `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
    }
    toIsoDate(value) {
        if (!value) {
            return undefined;
        }
        return value.toISOString().slice(0, 10);
    }
    buildOnboardingMismatches(submitted, extracted) {
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
        ];
        return comparisons
            .filter(([, submittedValue, extractedValue]) => this.normalizedCompareValue(submittedValue) !==
            this.normalizedCompareValue(extractedValue))
            .map(([field, submittedValue, extractedValue]) => ({
            field,
            submittedValue,
            extractedValue,
        }));
    }
    normalizedCompareValue(value) {
        return value?.trim().toLowerCase() ?? '';
    }
    isBlockingOnboardingMismatch(field) {
        return this.getBlockingMismatchFields().includes(field);
    }
    getBlockingMismatchFields() {
        return this.configService.get('onboarding.blockingMismatchFields') ?? [
            'fullName',
            'firstName',
            'lastName',
            'dateOfBirth',
            'phoneNumber',
            'faydaFin',
        ];
    }
    getReviewPolicyVersion() {
        return this.configService.get('onboarding.policyVersion') ?? 'v1';
    }
    getBlockingMismatchApprovalRoles() {
        return this.configService.get('onboarding.blockingMismatchApprovalRoles') ?? ['head_office_manager', 'admin'];
    }
    canApproveBlockingMismatch(role) {
        return this.getBlockingMismatchApprovalRoles().includes(role);
    }
    getBlockingMismatchApprovalReasonCodes() {
        return this.configService.get('onboarding.blockingMismatchApprovalReasonCodes') ?? ['official_source_verified', 'manual_document_review', 'customer_profile_corrected'];
    }
    isAllowedApprovalReasonCode(reasonCode) {
        return Boolean(reasonCode?.trim() &&
            this.getBlockingMismatchApprovalReasonCodes().includes(reasonCode.trim()));
    }
    getMissingMismatchAcknowledgements(blockingMismatchFields, acknowledgedMismatchFields) {
        const acknowledged = new Set((acknowledgedMismatchFields ?? []).map((field) => field.trim()).filter(Boolean));
        return blockingMismatchFields.filter((field) => !acknowledged.has(field));
    }
    requiresApprovalJustification() {
        return (this.configService.get('onboarding.requireApprovalJustification') ??
            true);
    }
    getSupersessionReasonCodes() {
        return (this.configService.get('onboarding.supersessionReasonCodes') ?? [
            'review_progressed',
            'customer_update_requested',
            'approval_recorded',
            'decision_corrected',
        ]);
    }
    isAllowedSupersessionReasonCode(reasonCode) {
        return Boolean(reasonCode?.trim() &&
            this.getSupersessionReasonCodes().includes(reasonCode.trim()));
    }
    async getPerformanceByScope(currentUser, query, field) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        return performanceModel.aggregate([
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
    buildScope(currentUser, query) {
        const periodStart = this.resolvePeriodStart(query.period ?? dto_1.DashboardPeriod.TODAY, query.date ? new Date(query.date) : new Date());
        const collectionMatch = {
            createdAt: { $gte: periodStart },
        };
        const performanceMatch = {
            periodStart,
        };
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            collectionMatch.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
            performanceMatch.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if ([enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
            currentUser.districtId) {
            collectionMatch.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
            performanceMatch.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        return { collectionMatch, performanceMatch };
    }
    buildManagerScope(currentUser) {
        const scope = {};
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            scope.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if ([enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
            currentUser.districtId) {
            scope.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        return scope;
    }
    resolvePerformanceModel(period) {
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return this.dailyPerformanceModel;
            case dto_1.DashboardPeriod.WEEK:
                return this.weeklyPerformanceModel;
            case dto_1.DashboardPeriod.MONTH:
                return this.monthlyPerformanceModel;
            case dto_1.DashboardPeriod.YEAR:
                return this.yearlyPerformanceModel;
        }
    }
    resolveOnboardingProfileUpdates(dto) {
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
    async getAutopayOperations(currentUser) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        return this.autopayModel.aggregate([
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
    async updateAutopayOperation(currentUser, id, dto) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const item = await this.autopayModel.findById(id);
        if (!item) {
            throw new common_1.NotFoundException('Autopay setting not found.');
        }
        const member = await this.memberModel
            .findById(item.memberId)
            .lean();
        if (!member) {
            throw new common_1.NotFoundException('Linked member not found.');
        }
        if (scope.branchId && member.branchId.toString() !== scope.branchId.toString()) {
            throw new common_1.ForbiddenException('Autopay setting is outside the current branch scope.');
        }
        if (scope.districtId && member.districtId.toString() !== scope.districtId.toString()) {
            throw new common_1.ForbiddenException('Autopay setting is outside the current district scope.');
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
    resolvePeriodStart(period, date) {
        const base = new Date(date);
        base.setHours(0, 0, 0, 0);
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return base;
            case dto_1.DashboardPeriod.WEEK: {
                const day = base.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                base.setDate(base.getDate() + diff);
                return base;
            }
            case dto_1.DashboardPeriod.MONTH:
                base.setDate(1);
                return base;
            case dto_1.DashboardPeriod.YEAR:
                base.setMonth(0, 1);
                return base;
        }
    }
    ensureManagerAccess(currentUser) {
        if (![
            enums_1.UserRole.BRANCH_MANAGER,
            enums_1.UserRole.DISTRICT_OFFICER,
            enums_1.UserRole.DISTRICT_MANAGER,
            enums_1.UserRole.HEAD_OFFICE_OFFICER,
            enums_1.UserRole.HEAD_OFFICE_MANAGER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only manager and admin roles can access dashboard data.');
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(school_payment_schema_1.SchoolPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_performance_daily_schema_1.StaffPerformanceDaily.name)),
    __param(3, (0, mongoose_1.InjectModel)(staff_performance_weekly_schema_1.StaffPerformanceWeekly.name)),
    __param(4, (0, mongoose_1.InjectModel)(staff_performance_monthly_schema_1.StaffPerformanceMonthly.name)),
    __param(5, (0, mongoose_1.InjectModel)(staff_performance_yearly_schema_1.StaffPerformanceYearly.name)),
    __param(6, (0, mongoose_1.InjectModel)(vote_schema_1.Vote.name)),
    __param(7, (0, mongoose_1.InjectModel)(vote_response_schema_1.VoteResponse.name)),
    __param(8, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(9, (0, mongoose_1.InjectModel)(member_profile_schema_1.MemberProfileEntity.name)),
    __param(10, (0, mongoose_1.InjectModel)(onboarding_evidence_schema_1.OnboardingEvidence.name)),
    __param(11, (0, mongoose_1.InjectModel)(autopay_setting_schema_1.AutopaySetting.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        auth_service_1.AuthService,
        audit_service_1.AuditService,
        storage_service_1.StorageService,
        config_1.ConfigService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map