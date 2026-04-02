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
const member_schema_1 = require("../members/schemas/member.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const vote_otp_port_1 = require("./vote-otp.port");
const vote_audit_log_schema_1 = require("./schemas/vote-audit-log.schema");
const vote_option_schema_1 = require("./schemas/vote-option.schema");
const vote_response_schema_1 = require("./schemas/vote-response.schema");
const vote_schema_1 = require("./schemas/vote.schema");
let VotingService = class VotingService {
    constructor(voteModel, voteOptionModel, voteResponseModel, voteAuditLogModel, memberModel, notificationModel, voteOtpPort, auditService) {
        this.voteModel = voteModel;
        this.voteOptionModel = voteOptionModel;
        this.voteResponseModel = voteResponseModel;
        this.voteAuditLogModel = voteAuditLogModel;
        this.memberModel = memberModel;
        this.notificationModel = notificationModel;
        this.voteOtpPort = voteOtpPort;
        this.auditService = auditService;
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
        this.ensureVoteIsOpen(vote, new Date());
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
        await this.notificationModel.create({
            userType: 'member',
            userId: new mongoose_2.Types.ObjectId(currentUser.sub),
            userRole: currentUser.role,
            type: enums_1.NotificationType.VOTING,
            status: enums_1.NotificationStatus.SENT,
            title: 'Vote Recorded',
            message: `Your vote for ${vote.title} has been recorded.`,
            entityType: 'vote',
            entityId: new mongoose_2.Types.ObjectId(voteId),
        });
        await this.auditService.log({
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
    async getVoteResults(voteId) {
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
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
                participationRate: eligibleShareholders === 0
                    ? 0
                    : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
            };
        });
    }
    async createVote(currentUser, dto) {
        this.ensureAdminAccess(currentUser);
        const vote = await this.voteModel.create({
            title: dto.title,
            description: dto.description,
            type: dto.type,
            status: enums_1.VoteStatus.DRAFT,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            createdBy: new mongoose_2.Types.ObjectId(currentUser.sub),
        });
        return this.toVoteSummary(vote);
    }
    async addVoteOption(currentUser, voteId, dto) {
        this.ensureAdminAccess(currentUser);
        const vote = await this.voteModel.findById(voteId).lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
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
        const [summary] = await this.voteResponseModel.aggregate([
            { $match: { voteId: new mongoose_2.Types.ObjectId(voteId) } },
            {
                $group: {
                    _id: null,
                    totalResponses: { $sum: 1 },
                    branches: { $addToSet: '$branchId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalResponses: 1,
                    uniqueBranches: { $size: '$branches' },
                },
            },
        ]);
        return summary ?? { totalResponses: 0, uniqueBranches: 0 };
    }
    async updateVoteStatus(voteId, status) {
        const vote = await this.voteModel
            .findByIdAndUpdate(voteId, { $set: { status } }, { new: true })
            .lean();
        if (!vote) {
            throw new common_1.NotFoundException('Vote event not found.');
        }
        return this.toVoteSummary(vote);
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
    __param(5, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(6, (0, common_1.Inject)(vote_otp_port_1.VOTE_OTP_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model, Object, audit_service_1.AuditService])
], VotingService);
//# sourceMappingURL=voting.service.js.map