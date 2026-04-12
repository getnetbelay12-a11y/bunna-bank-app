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
exports.VotingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const notifications_service_1 = require("../notifications/notifications.service");
const member_security_setting_schema_1 = require("../service-placeholders/schemas/member-security-setting.schema");
const vote_otp_port_1 = require("./vote-otp.port");
const vote_audit_log_schema_1 = require("./schemas/vote-audit-log.schema");
const vote_option_schema_1 = require("./schemas/vote-option.schema");
const vote_response_schema_1 = require("./schemas/vote-response.schema");
const vote_schema_1 = require("./schemas/vote.schema");
let VotingService = class VotingService {
    constructor(voteModel, voteOptionModel, voteResponseModel, voteAuditLogModel, memberModel, branchModel, districtModel, securityModel, voteOtpPort, auditService, notificationsService) {
        this.voteModel = voteModel;
        this.voteOptionModel = voteOptionModel;
        this.voteResponseModel = voteResponseModel;
        this.voteAuditLogModel = voteAuditLogModel;
        this.memberModel = memberModel;
        this.branchModel = branchModel;
        this.districtModel = districtModel;
        this.securityModel = securityModel;
        this.voteOtpPort = voteOtpPort;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
    }
    async getActiveVotes() {
        const now = new Date();
        const votes = await this.voteModel
            .find({
            status: enums_1.VoteStatus.OPEN,
            startDate: { $lte: now },
            endDate: { $gte: now },
        })
            .sort({ startDate: 1 })
            .lean();
        return votes.map((vote) => this.toVoteSummary(vote));
    }
    async getVote(voteId) {
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        const options = await this.voteOptionModel
            .find({ voteId: new mongoose_2.Types.ObjectId(voteId) })
            .sort({ displayOrder: 1 })
            .lean();
        return {
            ...this.toVoteSummary(vote),
            options: options.map((option) => this.toVoteOption(option)),
        };
    }
    async respondToVote(currentUser, voteId, dto) {
        this.ensureMemberAccess(currentUser);
        const [member, vote] = await Promise.all([
            this.memberModel.findById(currentUser.sub).lean(),
            this.voteModel.findById(voteId).lean(),
        ]);
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        this.ensureShareholder(member);
        this.ensureEligibleVotingMember(member);
        this.ensureVoteIsOpen(vote, new Date());
        await this.ensureVotingAllowed(currentUser.sub);
        const [option, existingResponse] = await Promise.all([
            this.voteOptionModel.findOne({
                _id: new mongoose_2.Types.ObjectId(dto.optionId),
                voteId: new mongoose_2.Types.ObjectId(voteId),
            }),
            this.voteResponseModel.findOne({
                voteId: new mongoose_2.Types.ObjectId(voteId),
                memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            }),
        ]);
        if (!option) {
            throw new common_1.BadRequestException('Selected vote option does not exist for this event.');
        }
        if (existingResponse) {
            throw new common_1.BadRequestException('Shareholder has already voted for this event.');
        }
        if (!dto.encryptedBallot.trim()) {
            throw new common_1.BadRequestException('Encrypted ballot is required.');
        }
        const otpVerifiedAt = await this.voteOtpPort.verify(currentUser.sub, dto.otpCode);
        const response = await this.voteResponseModel.create({
            voteId: new mongoose_2.Types.ObjectId(voteId),
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            optionId: new mongoose_2.Types.ObjectId(dto.optionId),
            branchId: member.branchId,
            districtId: member.districtId,
            encryptedBallot: dto.encryptedBallot,
            otpVerifiedAt,
        });
        await this.voteAuditLogModel.create({
            voteId: new mongoose_2.Types.ObjectId(voteId),
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            actorId: new mongoose_2.Types.ObjectId(currentUser.sub),
            actorRole: currentUser.role,
            action: 'vote_submitted',
            metadata: {
                optionId: dto.optionId,
            },
        });
        const notification = (0, banking_notification_builders_1.buildVoteRecordedNotification)(vote.title);
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: currentUser.sub,
            userRole: currentUser.role,
            type: notification.type,
            status: notification.status,
            title: notification.title,
            message: notification.message,
            entityType: 'vote',
            entityId: voteId,
        });
        await this.auditService.logActorAction({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: 'vote_submitted',
            entityType: 'vote',
            entityId: voteId,
            before: null,
            after: {
                optionId: dto.optionId,
                responseId: response._id.toString(),
            },
        });
        return {
            responseId: response._id.toString(),
            voteId,
            optionId: dto.optionId,
            otpVerifiedAt,
        };
    }
    async getVoteResults(currentUser, voteId) {
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        if (vote.status !== enums_1.VoteStatus.CLOSED) {
            this.ensureAdminAccess(currentUser);
        }
        const [options, responses] = await Promise.all([
            this.voteOptionModel
                .find({ voteId: new mongoose_2.Types.ObjectId(voteId) })
                .lean(),
            this.voteResponseModel
                .find({ voteId: new mongoose_2.Types.ObjectId(voteId) })
                .lean(),
        ]);
        const totalVotes = responses.length;
        return options
            .map((option) => {
            const votes = responses.filter((response) => response.optionId.toString() === option._id.toString()).length;
            return {
                optionId: option._id.toString(),
                optionName: option.name,
                votes,
                percentage: totalVotes === 0 ? 0 : Number(((votes / totalVotes) * 100).toFixed(2)),
            };
        })
            .sort((left, right) => right.votes - left.votes);
    }
    async listVotesForAdmin(currentUser) {
        this.ensureAdminAccess(currentUser);
        const [votes, eligibleShareholders] = await Promise.all([
            this.voteModel.find({}).sort({ startDate: -1 }).lean(),
            this.memberModel.countDocuments({
                memberType: enums_1.MemberType.SHAREHOLDER,
            }),
        ]);
        const voteIds = votes.map((vote) => vote._id);
        const responseCounts = voteIds.length
            ? await this.voteResponseModel.aggregate([
                {
                    $match: {
                        voteId: { $in: voteIds },
                    },
                },
                {
                    $group: {
                        _id: '$voteId',
                        totalResponses: { $sum: 1 },
                    },
                },
            ])
            : [];
        const responseMap = new Map(responseCounts.map((item) => [item._id.toString(), item.totalResponses]));
        return votes.map((vote) => {
            const totalResponses = responseMap.get(vote._id.toString()) ?? 0;
            return {
                ...this.toVoteSummary(vote),
                totalResponses,
                eligibleShareholders,
                participationRate: eligibleShareholders === 0
                    ? 0
                    : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
            };
        });
    }
    async createVote(currentUser, dto) {
        this.ensureAdminAccess(currentUser);
        this.validateVoteSchedule(dto.startDate, dto.endDate);
        const vote = await this.voteModel.create({
            title: dto.title,
            description: dto.description,
            type: dto.type,
            status: enums_1.VoteStatus.DRAFT,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            createdBy: new mongoose_2.Types.ObjectId(currentUser.sub),
        });
        await this.voteOptionModel.insertMany(dto.options.map((option, index) => ({
            voteId: vote._id,
            name: option.name,
            description: option.description,
            displayOrder: option.displayOrder ?? index + 1,
        })));
        return this.toVoteSummary(vote);
    }
    async addVoteOption(currentUser, voteId, dto) {
        this.ensureAdminAccess(currentUser);
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        if (vote.status !== enums_1.VoteStatus.DRAFT) {
            throw new common_1.BadRequestException('Vote options can only be changed while the event is in draft.');
        }
        const option = await this.voteOptionModel.create({
            voteId: new mongoose_2.Types.ObjectId(voteId),
            name: dto.name,
            description: dto.description,
            displayOrder: dto.displayOrder ?? 1,
        });
        return this.toVoteOption(option);
    }
    async openVote(currentUser, voteId) {
        this.ensureAdminAccess(currentUser);
        return this.updateVoteStatus(voteId, enums_1.VoteStatus.OPEN);
    }
    async closeVote(currentUser, voteId) {
        this.ensureAdminAccess(currentUser);
        return this.updateVoteStatus(voteId, enums_1.VoteStatus.CLOSED);
    }
    async getParticipation(currentUser, voteId) {
        this.ensureAdminAccess(currentUser);
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        const responses = await this.voteResponseModel
            .find({ voteId: new mongoose_2.Types.ObjectId(voteId) })
            .lean();
        const eligibleShareholders = await this.memberModel.countDocuments({
            memberType: enums_1.MemberType.SHAREHOLDER,
        });
        const branchCountMap = new Map();
        const districtCountMap = new Map();
        for (const response of responses) {
            const branchId = response.branchId.toString();
            const districtId = response.districtId.toString();
            branchCountMap.set(branchId, (branchCountMap.get(branchId) ?? 0) + 1);
            districtCountMap.set(districtId, (districtCountMap.get(districtId) ?? 0) + 1);
        }
        const [branches, districts] = await Promise.all([
            branchCountMap.size
                ? this.branchModel
                    .find({
                    _id: {
                        $in: Array.from(branchCountMap.keys()).map((id) => new mongoose_2.Types.ObjectId(id)),
                    },
                })
                    .lean()
                : Promise.resolve([]),
            districtCountMap.size
                ? this.districtModel
                    .find({
                    _id: {
                        $in: Array.from(districtCountMap.keys()).map((id) => new mongoose_2.Types.ObjectId(id)),
                    },
                })
                    .lean()
                : Promise.resolve([]),
        ]);
        return {
            totalResponses: responses.length,
            uniqueBranches: branchCountMap.size,
            uniqueDistricts: districtCountMap.size,
            eligibleShareholders,
            participationRate: eligibleShareholders === 0
                ? 0
                : Number(((responses.length / eligibleShareholders) * 100).toFixed(2)),
            branchParticipation: branches
                .map((branch) => ({
                id: branch._id.toString(),
                name: branch.name,
                totalResponses: branchCountMap.get(branch._id.toString()) ?? 0,
            }))
                .sort((left, right) => right.totalResponses - left.totalResponses),
            districtParticipation: districts
                .map((district) => ({
                id: district._id.toString(),
                name: district.name,
                totalResponses: districtCountMap.get(district._id.toString()) ?? 0,
            }))
                .sort((left, right) => right.totalResponses - left.totalResponses),
        };
    }
    async updateVoteStatus(voteId, status) {
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        if (status === enums_1.VoteStatus.OPEN) {
            this.validateVoteSchedule(vote.startDate.toISOString(), vote.endDate.toISOString());
            const optionCount = await this.voteOptionModel.countDocuments({
                voteId: new mongoose_2.Types.ObjectId(voteId),
            });
            if (optionCount < 2) {
                throw new common_1.BadRequestException('A governance vote must have at least two options before opening.');
            }
        }
        const updatedVote = await this.voteModel
            .findByIdAndUpdate(voteId, { $set: { status } }, { new: true })
            .lean();
        if (!updatedVote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        return this.toVoteSummary(updatedVote);
    }
    ensureMemberAccess(currentUser) {
        if (currentUser.role !== enums_1.UserRole.MEMBER &&
            currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only members can access voting endpoints.');
        }
    }
    ensureAdminAccess(currentUser) {
        if (currentUser.role !== enums_1.UserRole.HEAD_OFFICE_OFFICER &&
            currentUser.role !== enums_1.UserRole.HEAD_OFFICE_MANAGER &&
            currentUser.role !== enums_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only head office and admin users can manage votes.');
        }
    }
    ensureShareholder(member) {
        if (member.memberType !== enums_1.MemberType.SHAREHOLDER) {
            throw new common_1.ForbiddenException('Only shareholder members can vote.');
        }
    }
    ensureEligibleVotingMember(member) {
        if (!member.isActive) {
            throw new common_1.ForbiddenException('Inactive members cannot vote.');
        }
        if (!['verified', 'demo_approved', 'active_demo'].includes(member.kycStatus)) {
            throw new common_1.ForbiddenException('Complete identity verification before participating in governance voting.');
        }
    }
    async ensureVotingAllowed(memberId) {
        const security = await this.securityModel
            .findOne({ memberId: new mongoose_2.Types.ObjectId(memberId) })
            .lean();
        if (security?.accountLockEnabled) {
            throw new common_1.ForbiddenException('Account lock is enabled. Unlock the account before voting.');
        }
    }
    ensureVoteIsOpen(vote, now) {
        if (vote.status !== enums_1.VoteStatus.OPEN) {
            throw new common_1.BadRequestException('Voting event is not open.');
        }
        if (now < vote.startDate) {
            throw new common_1.BadRequestException('Voting event has not started yet.');
        }
        if (now > vote.endDate) {
            throw new common_1.BadRequestException('Voting event is already closed.');
        }
    }
    validateVoteSchedule(startDateRaw, endDateRaw) {
        const startDate = new Date(startDateRaw);
        const endDate = new Date(endDateRaw);
        if (Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate >= endDate) {
            throw new common_1.BadRequestException('Vote schedule is invalid. End date must be after start date.');
        }
    }
    toVoteSummary(vote) {
        return {
            id: vote.id ?? vote._id.toString(),
            title: vote.title,
            description: vote.description,
            type: vote.type,
            status: vote.status,
            startDate: vote.startDate,
            endDate: vote.endDate,
        };
    }
    toVoteOption(option) {
        return {
            id: option.id ?? option._id.toString(),
            voteId: option.voteId.toString(),
            name: option.name,
            description: option.description,
            displayOrder: option.displayOrder,
        };
    }
};
exports.VotingService = VotingService;
exports.VotingService = VotingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(vote_schema_1.Vote.name)),
    __param(1, (0, mongoose_1.InjectModel)(vote_option_schema_1.VoteOption.name)),
    __param(2, (0, mongoose_1.InjectModel)(vote_response_schema_1.VoteResponse.name)),
    __param(3, (0, mongoose_1.InjectModel)(vote_audit_log_schema_1.VoteAuditLog.name)),
    __param(4, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(5, (0, mongoose_1.InjectModel)(branch_schema_1.Branch.name)),
    __param(6, (0, mongoose_1.InjectModel)(district_schema_1.District.name)),
    __param(7, (0, mongoose_1.InjectModel)(member_security_setting_schema_1.MemberSecuritySetting.name)),
    __param(8, (0, common_1.Inject)(vote_otp_port_1.VOTE_OTP_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model, Object, audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], VotingService);
//# sourceMappingURL=voting.service.js.map