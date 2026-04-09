import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  MemberType,
  NotificationStatus,
  NotificationType,
  UserRole,
  VoteStatus,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { Branch, BranchDocument } from '../members/schemas/branch.schema';
import { District, DistrictDocument } from '../members/schemas/district.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { buildVoteRecordedNotification } from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import {
  MemberSecuritySetting,
  MemberSecuritySettingDocument,
} from '../service-placeholders/schemas/member-security-setting.schema';
import { CreateVoteOptionDto, CreateVoteDto, RespondToVoteDto } from './dto';
import {
  VoteAdminListItem,
  VoteDetailResult,
  VoteOptionResult,
  VoteParticipationResult,
  VoteResultsBreakdown,
  VoteSummaryResult,
} from './interfaces';
import { VoteOtpVerificationPort, VOTE_OTP_PORT } from './vote-otp.port';
import { VoteAuditLog, VoteAuditLogDocument } from './schemas/vote-audit-log.schema';
import { VoteOption, VoteOptionDocument } from './schemas/vote-option.schema';
import { VoteResponse, VoteResponseDocument } from './schemas/vote-response.schema';
import { Vote, VoteDocument } from './schemas/vote.schema';

@Injectable()
export class VotingService {
  constructor(
    @InjectModel(Vote.name)
    private readonly voteModel: Model<VoteDocument>,
    @InjectModel(VoteOption.name)
    private readonly voteOptionModel: Model<VoteOptionDocument>,
    @InjectModel(VoteResponse.name)
    private readonly voteResponseModel: Model<VoteResponseDocument>,
    @InjectModel(VoteAuditLog.name)
    private readonly voteAuditLogModel: Model<VoteAuditLogDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
    @InjectModel(District.name)
    private readonly districtModel: Model<DistrictDocument>,
    @InjectModel(MemberSecuritySetting.name)
    private readonly securityModel: Model<MemberSecuritySettingDocument>,
    @Inject(VOTE_OTP_PORT)
    private readonly voteOtpPort: VoteOtpVerificationPort,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getActiveVotes(): Promise<VoteSummaryResult[]> {
    const now = new Date();
    const votes = await this.voteModel
      .find({
        status: VoteStatus.OPEN,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ startDate: 1 })
      .lean<VoteDocument[]>();

    return votes.map((vote) => this.toVoteSummary(vote));
  }

  async getVote(voteId: string): Promise<VoteDetailResult> {
    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    const options = await this.voteOptionModel
      .find({ voteId: new Types.ObjectId(voteId) })
      .sort({ displayOrder: 1 })
      .lean<VoteOptionDocument[]>();

    return {
      ...this.toVoteSummary(vote),
      options: options.map((option) => this.toVoteOption(option)),
    };
  }

  async respondToVote(
    currentUser: AuthenticatedUser,
    voteId: string,
    dto: RespondToVoteDto,
  ) {
    this.ensureMemberAccess(currentUser);

    const [member, vote] = await Promise.all([
      this.memberModel.findById(currentUser.sub).lean<MemberDocument | null>(),
      this.voteModel.findById(voteId).lean<VoteDocument | null>(),
    ]);

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    this.ensureShareholder(member);
    this.ensureEligibleVotingMember(member);
    this.ensureVoteIsOpen(vote, new Date());
    await this.ensureVotingAllowed(currentUser.sub);

    const [option, existingResponse] = await Promise.all([
      this.voteOptionModel.findOne({
        _id: new Types.ObjectId(dto.optionId),
        voteId: new Types.ObjectId(voteId),
      }),
      this.voteResponseModel.findOne({
        voteId: new Types.ObjectId(voteId),
        memberId: new Types.ObjectId(currentUser.sub),
      }),
    ]);

    if (!option) {
      throw new BadRequestException('Selected vote option does not exist for this event.');
    }

    if (existingResponse) {
      throw new BadRequestException('Shareholder has already voted for this event.');
    }

    if (!dto.encryptedBallot.trim()) {
      throw new BadRequestException('Encrypted ballot is required.');
    }

    const otpVerifiedAt = await this.voteOtpPort.verify(currentUser.sub, dto.otpCode);

    const response = await this.voteResponseModel.create({
      voteId: new Types.ObjectId(voteId),
      memberId: new Types.ObjectId(currentUser.sub),
      optionId: new Types.ObjectId(dto.optionId),
      branchId: member.branchId,
      districtId: member.districtId,
      encryptedBallot: dto.encryptedBallot,
      otpVerifiedAt,
    });

    await this.voteAuditLogModel.create({
      voteId: new Types.ObjectId(voteId),
      memberId: new Types.ObjectId(currentUser.sub),
      actorId: new Types.ObjectId(currentUser.sub),
      actorRole: currentUser.role,
      action: 'vote_submitted',
      metadata: {
        optionId: dto.optionId,
      },
    });

    const notification = buildVoteRecordedNotification(vote.title);

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

  async getVoteResults(
    currentUser: AuthenticatedUser,
    voteId: string,
  ): Promise<VoteResultsBreakdown[]> {
    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    if (vote.status !== VoteStatus.CLOSED) {
      this.ensureAdminAccess(currentUser);
    }

    const [options, responses] = await Promise.all([
      this.voteOptionModel
        .find({ voteId: new Types.ObjectId(voteId) })
        .lean<VoteOptionDocument[]>(),
      this.voteResponseModel
        .find({ voteId: new Types.ObjectId(voteId) })
        .lean<VoteResponseDocument[]>(),
    ]);

    const totalVotes = responses.length;

    return options
      .map((option) => {
        const votes = responses.filter(
          (response) => response.optionId.toString() === option._id.toString(),
        ).length;

        return {
          optionId: option._id.toString(),
          optionName: option.name,
          votes,
          percentage:
            totalVotes === 0 ? 0 : Number(((votes / totalVotes) * 100).toFixed(2)),
        };
      })
      .sort((left, right) => right.votes - left.votes);
  }

  async listVotesForAdmin(
    currentUser: AuthenticatedUser,
  ): Promise<VoteAdminListItem[]> {
    this.ensureAdminAccess(currentUser);

    const [votes, eligibleShareholders] = await Promise.all([
      this.voteModel.find({}).sort({ startDate: -1 }).lean<VoteDocument[]>(),
      this.memberModel.countDocuments({
        memberType: MemberType.SHAREHOLDER,
      }),
    ]);

    const voteIds = votes.map((vote) => vote._id);
    const responseCounts = voteIds.length
      ? await this.voteResponseModel.aggregate<{
          _id: Types.ObjectId;
          totalResponses: number;
        }>([
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

    const responseMap = new Map(
      responseCounts.map((item) => [item._id.toString(), item.totalResponses]),
    );

    return votes.map((vote) => {
      const totalResponses = responseMap.get(vote._id.toString()) ?? 0;

      return {
        ...this.toVoteSummary(vote),
        totalResponses,
        eligibleShareholders,
        participationRate:
          eligibleShareholders === 0
            ? 0
            : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
      };
    });
  }

  async createVote(currentUser: AuthenticatedUser, dto: CreateVoteDto) {
    this.ensureAdminAccess(currentUser);
    this.validateVoteSchedule(dto.startDate, dto.endDate);

    const vote = await this.voteModel.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: VoteStatus.DRAFT,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      createdBy: new Types.ObjectId(currentUser.sub),
    });

    await this.voteOptionModel.insertMany(
      dto.options.map((option, index) => ({
        voteId: vote._id,
        name: option.name,
        description: option.description,
        displayOrder: option.displayOrder ?? index + 1,
      })),
    );

    return this.toVoteSummary(vote);
  }

  async addVoteOption(
    currentUser: AuthenticatedUser,
    voteId: string,
    dto: CreateVoteOptionDto,
  ): Promise<VoteOptionResult> {
    this.ensureAdminAccess(currentUser);

    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    if (vote.status !== VoteStatus.DRAFT) {
      throw new BadRequestException(
        'Vote options can only be changed while the event is in draft.',
      );
    }

    const option = await this.voteOptionModel.create({
      voteId: new Types.ObjectId(voteId),
      name: dto.name,
      description: dto.description,
      displayOrder: dto.displayOrder ?? 1,
    });

    return this.toVoteOption(option);
  }

  async openVote(currentUser: AuthenticatedUser, voteId: string) {
    this.ensureAdminAccess(currentUser);
    return this.updateVoteStatus(voteId, VoteStatus.OPEN);
  }

  async closeVote(currentUser: AuthenticatedUser, voteId: string) {
    this.ensureAdminAccess(currentUser);
    return this.updateVoteStatus(voteId, VoteStatus.CLOSED);
  }

  async getParticipation(
    currentUser: AuthenticatedUser,
    voteId: string,
  ): Promise<VoteParticipationResult> {
    this.ensureAdminAccess(currentUser);

    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    const responses = await this.voteResponseModel
      .find({ voteId: new Types.ObjectId(voteId) })
      .lean<VoteResponseDocument[]>();
    const eligibleShareholders = await this.memberModel.countDocuments({
      memberType: MemberType.SHAREHOLDER,
    });

    const branchCountMap = new Map<string, number>();
    const districtCountMap = new Map<string, number>();

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
                $in: Array.from(branchCountMap.keys()).map((id) => new Types.ObjectId(id)),
              },
            })
            .lean<BranchDocument[]>()
        : Promise.resolve([] as BranchDocument[]),
      districtCountMap.size
        ? this.districtModel
            .find({
              _id: {
                $in: Array.from(districtCountMap.keys()).map((id) => new Types.ObjectId(id)),
              },
            })
            .lean<DistrictDocument[]>()
        : Promise.resolve([] as DistrictDocument[]),
    ]);

    return {
      totalResponses: responses.length,
      uniqueBranches: branchCountMap.size,
      uniqueDistricts: districtCountMap.size,
      eligibleShareholders,
      participationRate:
        eligibleShareholders === 0
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

  private async updateVoteStatus(voteId: string, status: VoteStatus) {
    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    if (status === VoteStatus.OPEN) {
      this.validateVoteSchedule(
        vote.startDate.toISOString(),
        vote.endDate.toISOString(),
      );
      const optionCount = await this.voteOptionModel.countDocuments({
        voteId: new Types.ObjectId(voteId),
      });

      if (optionCount < 2) {
        throw new BadRequestException(
          'A governance vote must have at least two options before opening.',
        );
      }
    }

    const updatedVote = await this.voteModel
      .findByIdAndUpdate(voteId, { $set: { status } }, { new: true })
      .lean<VoteDocument | null>();

    if (!updatedVote) {
      throw new NotFoundException('Vote event not found.');
    }

    return this.toVoteSummary(updatedVote);
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only members can access voting endpoints.');
    }
  }

  private ensureAdminAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.HEAD_OFFICE_OFFICER &&
      currentUser.role !== UserRole.HEAD_OFFICE_MANAGER &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only head office and admin users can manage votes.');
    }
  }

  private ensureShareholder(member: MemberDocument): void {
    if (member.memberType !== MemberType.SHAREHOLDER) {
      throw new ForbiddenException('Only shareholder members can vote.');
    }
  }

  private ensureEligibleVotingMember(member: MemberDocument): void {
    if (!member.isActive) {
      throw new ForbiddenException('Inactive members cannot vote.');
    }

    if (!['verified', 'demo_approved', 'active_demo'].includes(member.kycStatus)) {
      throw new ForbiddenException(
        'Complete identity verification before participating in governance voting.',
      );
    }
  }

  private async ensureVotingAllowed(memberId: string) {
    const security = await this.securityModel
      .findOne({ memberId: new Types.ObjectId(memberId) })
      .lean<MemberSecuritySettingDocument | null>();

    if (security?.accountLockEnabled) {
      throw new ForbiddenException(
        'Account lock is enabled. Unlock the account before voting.',
      );
    }
  }

  private ensureVoteIsOpen(vote: VoteDocument, now: Date): void {
    if (vote.status !== VoteStatus.OPEN) {
      throw new BadRequestException('Voting event is not open.');
    }

    if (now < vote.startDate) {
      throw new BadRequestException('Voting event has not started yet.');
    }

    if (now > vote.endDate) {
      throw new BadRequestException('Voting event is already closed.');
    }
  }

  private validateVoteSchedule(startDateRaw: string, endDateRaw: string) {
    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate >= endDate
    ) {
      throw new BadRequestException(
        'Vote schedule is invalid. End date must be after start date.',
      );
    }
  }

  private toVoteSummary(vote: VoteDocument | (VoteDocument & { id?: string })): VoteSummaryResult {
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

  private toVoteOption(option: VoteOptionDocument | (VoteOptionDocument & { id?: string })): VoteOptionResult {
    return {
      id: option.id ?? option._id.toString(),
      voteId: option.voteId.toString(),
      name: option.name,
      description: option.description,
      displayOrder: option.displayOrder,
    };
  }
}
