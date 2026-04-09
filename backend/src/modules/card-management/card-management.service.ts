import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { NotificationType, UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCardRequestDto,
  RequestCardReplacementDto,
  UpdateCardRequestStatusDto,
} from './dto';
import { CardRequestStatus, CardRequestType, CardStatus } from './card-management.types';
import { Card, CardDocument } from './schemas/card.schema';
import { CardEvent, CardEventDocument } from './schemas/card-event.schema';
import { CardRequest, CardRequestDocument } from './schemas/card-request.schema';

@Injectable()
export class CardManagementService {
  constructor(
    @InjectModel(Card.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(CardRequest.name)
    private readonly cardRequestModel: Model<CardRequestDocument>,
    @InjectModel(CardEvent.name)
    private readonly cardEventModel: Model<CardEventDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async fetchMyCards(currentUser: AuthenticatedUser) {
    const memberId = await this.requireMember(currentUser);
    const items = await this.cardModel
      .find({ memberId })
      .sort({ updatedAt: -1 })
      .lean<CardDocument[]>();

    return items.map((item) => this.toCardResult(item));
  }

  async createRequest(currentUser: AuthenticatedUser, dto: CreateCardRequestDto) {
    const member = await this.loadActiveMember(currentUser);
    const memberId = member._id;
    const requestType = dto.requestType ?? CardRequestType.NEW_ISSUE;

    const existingPending = await this.cardRequestModel.exists({
      memberId,
      requestType,
      status: { $in: [CardRequestStatus.SUBMITTED, CardRequestStatus.UNDER_REVIEW] },
    });
    if (existingPending) {
      throw new BadRequestException('A card request is already in progress.');
    }

    let card = await this.cardModel.findOne({ memberId, status: { $ne: CardStatus.BLOCKED } });
    if (!card) {
      card = await this.cardModel.create({
        memberId,
        cardType: dto.cardType ?? 'debit',
        preferredBranch: dto.preferredBranch ?? member.preferredBranchName,
        status: CardStatus.PENDING_ISSUE,
      });
    }

    const request = await this.cardRequestModel.create({
      memberId,
      cardId: card._id,
      requestType,
      status: CardRequestStatus.SUBMITTED,
      preferredBranch: dto.preferredBranch ?? member.preferredBranchName,
      reason: dto.reason?.trim(),
    });

    await this.cardEventModel.create({
      cardId: card._id,
      actorType: 'member',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? member.fullName,
      eventType: 'requested',
      note: requestType === CardRequestType.REPLACEMENT ? 'Replacement requested.' : 'New card requested.',
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType:
        requestType === CardRequestType.REPLACEMENT ? 'card_replacement_requested' : 'card_requested',
      entityType: 'card',
      entityId: card._id.toString(),
      before: null,
      after: {
        requestType,
        preferredBranch: request.preferredBranch,
        status: request.status,
      },
    });

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: memberId.toString(),
      type: NotificationType.SERVICE_REQUEST,
      title: requestType === CardRequestType.REPLACEMENT ? 'Card Replacement Requested' : 'Card Request Submitted',
      message:
        requestType === CardRequestType.REPLACEMENT
          ? 'Your card replacement request was submitted and is awaiting review.'
          : 'Your new card request was submitted and is awaiting review.',
      entityType: 'card',
      entityId: card._id.toString(),
      actionLabel: 'Open card',
      priority: 'normal',
      deepLink: `/cards/${card._id.toString()}`,
    });

    return {
      card: this.toCardResult(card),
      request: this.toRequestResult(request),
    };
  }

  async lock(currentUser: AuthenticatedUser, cardId: string) {
    const card = await this.loadOwnedCard(currentUser, cardId);
    if (card.status === CardStatus.LOCKED) {
      throw new BadRequestException('Card is already locked.');
    }

    const beforeStatus = card.status;
    card.status = CardStatus.LOCKED;
    card.lockedAt = new Date();
    await card.save();

    await this.recordCardEvent(card, currentUser, 'locked', 'Card locked by member.');
    await this.logCardAudit(currentUser, 'card_locked', card, beforeStatus);

    return this.toCardResult(card);
  }

  async unlock(currentUser: AuthenticatedUser, cardId: string) {
    const card = await this.loadOwnedCard(currentUser, cardId);
    if (card.status !== CardStatus.LOCKED) {
      throw new BadRequestException('Only locked cards can be unlocked.');
    }

    const beforeStatus = card.status;
    card.status = CardStatus.ACTIVE;
    card.lockedAt = undefined;
    await card.save();

    await this.recordCardEvent(card, currentUser, 'unlocked', 'Card unlocked by member.');
    await this.logCardAudit(currentUser, 'card_unlocked', card, beforeStatus);

    return this.toCardResult(card);
  }

  async requestReplacement(
    currentUser: AuthenticatedUser,
    cardId: string,
    dto: RequestCardReplacementDto,
  ) {
    const card = await this.loadOwnedCard(currentUser, cardId);
    const existingPending = await this.cardRequestModel.exists({
      memberId: card.memberId,
      cardId: card._id,
      requestType: CardRequestType.REPLACEMENT,
      status: { $in: [CardRequestStatus.SUBMITTED, CardRequestStatus.UNDER_REVIEW] },
    });
    if (existingPending) {
      throw new BadRequestException('A replacement request is already in progress.');
    }

    card.status = CardStatus.REPLACEMENT_REQUESTED;
    await card.save();

    const request = await this.cardRequestModel.create({
      memberId: card.memberId,
      cardId: card._id,
      requestType: CardRequestType.REPLACEMENT,
      status: CardRequestStatus.SUBMITTED,
      preferredBranch: card.preferredBranch,
      reason: dto.reason?.trim(),
    });

    await this.recordCardEvent(card, currentUser, 'replacement_requested', dto.reason?.trim());
    await this.logCardAudit(currentUser, 'card_replacement_requested', card, CardStatus.ACTIVE);

    return {
      card: this.toCardResult(card),
      request: this.toRequestResult(request),
    };
  }

  async listManagerRequests(currentUser: AuthenticatedUser) {
    this.ensureManager(currentUser);
    const filter = this.buildManagerScope(currentUser);
    const requests = await this.cardRequestModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .lean<CardRequestDocument[]>();

    return requests.map((item) => this.toRequestResult(item));
  }

  async getManagerRequestDetail(currentUser: AuthenticatedUser, requestId: string) {
    this.ensureManager(currentUser);
    const request = await this.cardRequestModel.findById(requestId).lean<CardRequestDocument | null>();
    if (!request) {
      throw new NotFoundException('Card request not found.');
    }

    const member = await this.memberModel.findById(request.memberId).lean<MemberDocument | null>();
    if (!member) {
      throw new NotFoundException('Member not found for this card request.');
    }

    this.assertManagerScope(currentUser, member);

    const card = request.cardId
      ? await this.cardModel.findById(request.cardId).lean<CardDocument | null>()
      : null;
    const timeline = request.cardId
      ? await this.cardEventModel
          .find({ cardId: request.cardId })
          .sort({ createdAt: 1 })
          .lean<CardEventDocument[]>()
      : [];

    return {
      ...this.toRequestResult(request),
      memberName: member.fullName,
      customerId: member.customerId,
      phoneNumber: member.phone,
      card: card ? this.toCardResult(card) : null,
      timeline: timeline.map((event) => ({
        id: event._id.toString(),
        actorType: event.actorType,
        actorId: event.actorId,
        actorName: event.actorName,
        eventType: event.eventType,
        note: event.note,
        createdAt: event.createdAt,
      })),
    };
  }

  async updateRequestStatus(
    currentUser: AuthenticatedUser,
    requestId: string,
    dto: UpdateCardRequestStatusDto,
  ) {
    this.ensureManager(currentUser);
    const request = await this.cardRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Card request not found.');
    }

    const card = request.cardId ? await this.cardModel.findById(request.cardId) : null;
    if (!card) {
      throw new NotFoundException('Card not found for this request.');
    }

    const member = await this.memberModel.findById(request.memberId);
    if (!member) {
      throw new NotFoundException('Member not found for this card request.');
    }

    this.assertManagerScope(currentUser, member);

    request.status = dto.status;
    await request.save();

    if (dto.status === CardRequestStatus.COMPLETED) {
      card.status = CardStatus.ACTIVE;
      card.issuedAt = new Date();
      if (!card.last4) {
        card.last4 = '4821';
      }
    } else if (dto.status === CardRequestStatus.REJECTED) {
      card.status = CardStatus.BLOCKED;
    } else {
      card.status =
        request.requestType === CardRequestType.REPLACEMENT
          ? CardStatus.REPLACEMENT_REQUESTED
          : CardStatus.PENDING_ISSUE;
    }
    await card.save();

    await this.cardEventModel.create({
      cardId: card._id,
      actorType: 'staff',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? currentUser.identifier,
      eventType: 'request_status_updated',
      note: dto.note?.trim(),
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'card_request_status_updated',
      entityType: 'card_request',
      entityId: request._id.toString(),
      before: null,
      after: {
        status: request.status,
        cardStatus: card.status,
        note: dto.note?.trim(),
      },
    });

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: request.memberId.toString(),
      type: NotificationType.SERVICE_REQUEST,
      title: this.buildCardRequestStatusTitle(request.requestType, dto.status),
      message: this.buildCardRequestStatusMessage(request.requestType, dto.status, dto.note?.trim()),
      entityType: 'card',
      entityId: card._id.toString(),
      actionLabel: 'Open card',
      priority: dto.status === CardRequestStatus.REJECTED ? 'high' : 'normal',
      deepLink: `/cards/${card._id.toString()}`,
    });

    return {
      card: this.toCardResult(card),
      request: this.toRequestResult(request),
    };
  }

  private async loadOwnedCard(currentUser: AuthenticatedUser, cardId: string) {
    const memberId = await this.requireMember(currentUser);
    const card = await this.cardModel.findById(cardId);
    if (!card || card.memberId.toString() !== memberId.toString()) {
      throw new NotFoundException('Card not found.');
    }
    return card;
  }

  private async loadActiveMember(currentUser: AuthenticatedUser) {
    const memberId = await this.requireMember(currentUser);
    const member = await this.memberModel.findById(memberId);
    if (!member || !member.isActive) {
      throw new ForbiddenException('Inactive members cannot access card services.');
    }
    return member;
  }

  private async requireMember(currentUser: AuthenticatedUser) {
    if (![UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER].includes(currentUser.role)) {
      throw new ForbiddenException('Only members can access card services.');
    }
    const memberId = currentUser.memberId ?? currentUser.sub;
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestException('Invalid member identifier.');
    }
    return new Types.ObjectId(memberId);
  }

  private ensureManager(currentUser: AuthenticatedUser) {
    const allowed = new Set([
      UserRole.SUPPORT_AGENT,
      UserRole.BRANCH_MANAGER,
      UserRole.DISTRICT_OFFICER,
      UserRole.DISTRICT_MANAGER,
      UserRole.HEAD_OFFICE_OFFICER,
      UserRole.HEAD_OFFICE_MANAGER,
      UserRole.ADMIN,
    ]);
    if (!allowed.has(currentUser.role)) {
      throw new ForbiddenException('Only staff users can access card operations.');
    }
  }

  private buildManagerScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { preferredBranch: currentUser.branchName };
    }
    return {};
  }

  private assertManagerScope(currentUser: AuthenticatedUser, member: MemberDocument) {
    const scope = this.buildManagerScope(currentUser);
    if (scope.preferredBranch && member.preferredBranchName !== scope.preferredBranch) {
      throw new ForbiddenException('This card request is outside your branch scope.');
    }
  }

  private async recordCardEvent(
    card: CardDocument,
    currentUser: AuthenticatedUser,
    eventType: 'locked' | 'unlocked' | 'replacement_requested',
    note?: string,
  ) {
    await this.cardEventModel.create({
      cardId: card._id,
      actorType: 'member',
      actorId: currentUser.sub,
      actorName: currentUser.fullName ?? currentUser.identifier,
      eventType,
      note,
    });
  }

  private async logCardAudit(
    currentUser: AuthenticatedUser,
    actionType: string,
    card: CardDocument,
    beforeStatus: CardStatus,
  ) {
    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType,
      entityType: 'card',
      entityId: card._id.toString(),
      before: { status: beforeStatus },
      after: { status: card.status },
    });
  }

  private toCardResult(card: CardDocument | (CardDocument & { id?: string })) {
    return {
      id: card.id ?? card._id.toString(),
      memberId: card.memberId.toString(),
      cardType: card.cardType,
      last4: card.last4,
      status: card.status,
      preferredBranch: card.preferredBranch,
      channelControls: card.channelControls,
      issuedAt: card.issuedAt,
      lockedAt: card.lockedAt,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  private toRequestResult(
    request: CardRequestDocument | (CardRequestDocument & { id?: string }),
  ) {
    return {
      id: request.id ?? request._id.toString(),
      memberId: request.memberId.toString(),
      cardId: request.cardId?.toString(),
      requestType: request.requestType,
      status: request.status,
      preferredBranch: request.preferredBranch,
      reason: request.reason,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  private buildCardRequestStatusTitle(requestType: CardRequestType, status: CardRequestStatus) {
    const requestLabel =
      requestType === CardRequestType.REPLACEMENT ? 'Card Replacement' : 'Card Request';
    const statusLabel =
      status === CardRequestStatus.UNDER_REVIEW
        ? 'Under Review'
        : status === CardRequestStatus.COMPLETED
          ? 'Completed'
          : status === CardRequestStatus.REJECTED
            ? 'Rejected'
            : status === CardRequestStatus.APPROVED
              ? 'Approved'
              : 'Updated';

    return `${requestLabel} ${statusLabel}`;
  }

  private buildCardRequestStatusMessage(
    requestType: CardRequestType,
    status: CardRequestStatus,
    note?: string,
  ) {
    const subject =
      requestType === CardRequestType.REPLACEMENT
        ? 'Your card replacement request'
        : 'Your card request';
    const statusMessage =
      status === CardRequestStatus.UNDER_REVIEW
        ? 'is now under review.'
        : status === CardRequestStatus.COMPLETED
          ? 'has been completed.'
          : status === CardRequestStatus.REJECTED
            ? 'was rejected.'
            : status === CardRequestStatus.APPROVED
              ? 'was approved.'
              : 'was updated.';

    return note ? `${subject} ${statusMessage} ${note}` : `${subject} ${statusMessage}`;
  }
}
