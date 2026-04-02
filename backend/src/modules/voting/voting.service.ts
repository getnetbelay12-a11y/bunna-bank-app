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
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
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
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject(VOTE_OTP_PORT)
    private readonly voteOtpPort: VoteOtpVerificationPort,
    private readonly auditService: AuditService,
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
    this.ensureVoteIsOpen(vote, new Date());

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

    await this.notificationModel.create({
      userType: 'member',
      userId: new Types.ObjectId(currentUser.sub),
      userRole: currentUser.role,
      type: NotificationType.VOTING,
      status: NotificationStatus.SENT,
      title: 'Vote Recorded',
      message: `Your vote for ${vote.title} has been recorded.`,
      entityType: 'vote',
      entityId: new Types.ObjectId(voteId),
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

  async getVoteResults(voteId: string): Promise<VoteResultsBreakdown[]> {
    const vote = await this.voteModel.findById(voteId).lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
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
        participationRate:
          eligibleShareholders === 0
            ? 0
            : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
      };
    });
  }

  async createVote(currentUser: AuthenticatedUser, dto: CreateVoteDto) {
    this.ensureAdminAccess(currentUser);

    const vote = await this.voteModel.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: VoteStatus.DRAFT,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      createdBy: new Types.ObjectId(currentUser.sub),
    });

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

    const [summary] = await this.voteResponseModel.aggregate<VoteParticipationResult>([
      { $match: { voteId: new Types.ObjectId(voteId) } },
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

  private async updateVoteStatus(voteId: string, status: VoteStatus) {
    const vote = await this.voteModel
      .findByIdAndUpdate(voteId, { $set: { status } }, { new: true })
      .lean<VoteDocument | null>();

    if (!vote) {
      throw new NotFoundException('Vote event not found.');
    }

    return this.toVoteSummary(vote);
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
