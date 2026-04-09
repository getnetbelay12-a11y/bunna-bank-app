import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CardManagementService } from './card-management.service';
import { CardRequestStatus, CardRequestType, CardStatus } from './card-management.types';

describe('CardManagementService', () => {
  let cardModel: any;
  let cardRequestModel: any;
  let cardEventModel: any;
  let memberModel: any;
  let auditService: jest.Mocked<AuditService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let service: CardManagementService;

  const memberId = new Types.ObjectId();

  beforeEach(() => {
    cardModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    cardRequestModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };
    cardEventModel = {
      create: jest.fn(),
    };
    memberModel = {
      findById: jest.fn(),
    };
    auditService = { logActorAction: jest.fn() } as never;
    notificationsService = { createNotification: jest.fn() } as never;

    service = new CardManagementService(
      cardModel,
      cardRequestModel,
      cardEventModel,
      memberModel,
      auditService,
      notificationsService,
    );
  });

  it('creates a new card request for a member', async () => {
    const cardId = new Types.ObjectId();
    memberModel.findById.mockResolvedValue({
      _id: memberId,
      fullName: 'Abebe Kebede',
      preferredBranchName: 'Bahir Dar Branch',
      isActive: true,
    });
    cardRequestModel.exists.mockResolvedValue(false);
    cardModel.findOne.mockResolvedValue(null);
    cardModel.create.mockResolvedValue({
      _id: cardId,
      memberId,
      cardType: 'debit',
      status: CardStatus.PENDING_ISSUE,
      preferredBranch: 'Bahir Dar Branch',
      channelControls: { atm: true, pos: true, ecommerce: false },
    });
    cardRequestModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      memberId,
      cardId,
      requestType: CardRequestType.NEW_ISSUE,
      status: 'submitted',
      preferredBranch: 'Bahir Dar Branch',
    });

    const result = await service.createRequest(
      { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
      {},
    );

    expect(result.card.id).toBe(cardId.toString());
    expect(cardEventModel.create).toHaveBeenCalled();
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'card',
        entityId: cardId.toString(),
        actionLabel: 'Open card',
      }),
    );
  });

  it('locks and unlocks a member card', async () => {
    const cardId = new Types.ObjectId();
    const save = jest.fn();
    cardModel.findById.mockResolvedValueOnce({
      _id: cardId,
      memberId,
      status: CardStatus.ACTIVE,
      save,
    });

    const locked = await service.lock(
      { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
      cardId.toString(),
    );

    expect(locked.status).toBe(CardStatus.LOCKED);

    cardModel.findById.mockResolvedValueOnce({
      _id: cardId,
      memberId,
      status: CardStatus.LOCKED,
      save,
    });

    const unlocked = await service.unlock(
      { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
      cardId.toString(),
    );

    expect(unlocked.status).toBe(CardStatus.ACTIVE);
  });

  it('creates a replacement request for an owned card', async () => {
    const cardId = new Types.ObjectId();
    const save = jest.fn();
    cardModel.findById.mockResolvedValue({
      _id: cardId,
      memberId,
      status: CardStatus.ACTIVE,
      preferredBranch: 'Bahir Dar Branch',
      save,
    });
    cardRequestModel.exists.mockResolvedValue(false);
    cardRequestModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      memberId,
      cardId,
      requestType: CardRequestType.REPLACEMENT,
      status: 'submitted',
    });

    const result = await service.requestReplacement(
      { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
      cardId.toString(),
      { reason: 'Card damaged' },
    );

    expect(result.card.status).toBe(CardStatus.REPLACEMENT_REQUESTED);
    expect(cardEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'replacement_requested' }),
    );
  });

  it('rejects duplicate replacement requests', async () => {
    const cardId = new Types.ObjectId();
    cardModel.findById.mockResolvedValue({
      _id: cardId,
      memberId,
      status: CardStatus.ACTIVE,
      save: jest.fn(),
    });
    cardRequestModel.exists.mockResolvedValue(true);

    await expect(
      service.requestReplacement(
        { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
        cardId.toString(),
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('raises not found for cards outside member ownership', async () => {
    cardModel.findById.mockResolvedValue(null);

    await expect(
      service.lock(
        { sub: memberId.toString(), role: UserRole.MEMBER, memberId: memberId.toString() },
        new Types.ObjectId().toString(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows managers to review and complete card requests', async () => {
    const cardId = new Types.ObjectId();
    const requestId = new Types.ObjectId();
    const requestSave = jest.fn();
    const cardSave = jest.fn();

    cardRequestModel.findById = jest.fn().mockResolvedValue({
      _id: requestId,
      memberId,
      cardId,
      requestType: CardRequestType.NEW_ISSUE,
      status: 'submitted',
      save: requestSave,
    });
    cardModel.findById.mockResolvedValue({
      _id: cardId,
      memberId,
      status: CardStatus.PENDING_ISSUE,
      save: cardSave,
    });
    memberModel.findById.mockResolvedValue({
      _id: memberId,
      preferredBranchName: 'Bahir Dar Branch',
    });

    const result = await service.updateRequestStatus(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchName: 'Bahir Dar Branch',
      },
      requestId.toString(),
      { status: CardRequestStatus.COMPLETED, note: 'Card is ready.' },
    );

    expect(requestSave).toHaveBeenCalled();
    expect(cardSave).toHaveBeenCalled();
    expect(result.request.status).toBe(CardRequestStatus.COMPLETED);
    expect(result.card.status).toBe(CardStatus.ACTIVE);
    expect(cardEventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'request_status_updated' }),
    );
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: 'member',
        userId: memberId.toString(),
        type: 'service_request',
        title: 'Card Request Completed',
        message: 'Your card request has been completed. Card is ready.',
        entityType: 'card',
        entityId: cardId.toString(),
        actionLabel: 'Open card',
        priority: 'normal',
        deepLink: `/cards/${cardId.toString()}`,
      }),
    );
  });

  it('sends a high-priority member notification when a manager rejects a replacement request', async () => {
    const cardId = new Types.ObjectId();
    const requestId = new Types.ObjectId();
    const requestSave = jest.fn();
    const cardSave = jest.fn();

    cardRequestModel.findById = jest.fn().mockResolvedValue({
      _id: requestId,
      memberId,
      cardId,
      requestType: CardRequestType.REPLACEMENT,
      status: CardRequestStatus.UNDER_REVIEW,
      save: requestSave,
    });
    cardModel.findById.mockResolvedValue({
      _id: cardId,
      memberId,
      status: CardStatus.REPLACEMENT_REQUESTED,
      save: cardSave,
    });
    memberModel.findById.mockResolvedValue({
      _id: memberId,
      preferredBranchName: 'Bahir Dar Branch',
    });

    const result = await service.updateRequestStatus(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchName: 'Bahir Dar Branch',
      },
      requestId.toString(),
      { status: CardRequestStatus.REJECTED, note: 'Please visit the branch with a valid ID.' },
    );

    expect(requestSave).toHaveBeenCalled();
    expect(cardSave).toHaveBeenCalled();
    expect(result.request.status).toBe(CardRequestStatus.REJECTED);
    expect(result.card.status).toBe(CardStatus.BLOCKED);
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userType: 'member',
        userId: memberId.toString(),
        type: 'service_request',
        title: 'Card Replacement Rejected',
        message:
          'Your card replacement request was rejected. Please visit the branch with a valid ID.',
        entityType: 'card',
        entityId: cardId.toString(),
        actionLabel: 'Open card',
        priority: 'high',
        deepLink: `/cards/${cardId.toString()}`,
      }),
    );
  });

  it('returns manager request detail with member, card, and timeline context', async () => {
    const cardId = new Types.ObjectId();
    const requestId = new Types.ObjectId();

    cardRequestModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: requestId,
        memberId,
        cardId,
        requestType: CardRequestType.REPLACEMENT,
        status: CardRequestStatus.UNDER_REVIEW,
        preferredBranch: 'Bahir Dar Branch',
        reason: 'Card damaged',
        createdAt: new Date('2026-03-10T09:00:00.000Z'),
        updatedAt: new Date('2026-03-12T11:15:00.000Z'),
      }),
    });
    memberModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: memberId,
        fullName: 'Abebe Kebede',
        customerId: 'BUN-100001',
        phone: '0911000001',
        preferredBranchName: 'Bahir Dar Branch',
      }),
    });
    cardModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: cardId,
        memberId,
        cardType: 'debit',
        status: CardStatus.REPLACEMENT_REQUESTED,
        preferredBranch: 'Bahir Dar Branch',
        channelControls: { atm: true, pos: true, ecommerce: false },
        last4: '4821',
        createdAt: new Date('2026-03-10T09:00:00.000Z'),
        updatedAt: new Date('2026-03-12T11:15:00.000Z'),
      }),
    });
    cardEventModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            actorType: 'member',
            actorName: 'Abebe Kebede',
            eventType: 'replacement_requested',
            note: 'Card damaged',
            createdAt: new Date('2026-03-10T09:00:00.000Z'),
          },
        ]),
      }),
    });

    const result = await service.getManagerRequestDetail(
      {
        sub: new Types.ObjectId().toString(),
        role: UserRole.BRANCH_MANAGER,
        branchName: 'Bahir Dar Branch',
      },
      requestId.toString(),
    );

    expect(result.memberName).toBe('Abebe Kebede');
    expect(result.customerId).toBe('BUN-100001');
    expect(result.card?.status).toBe(CardStatus.REPLACEMENT_REQUESTED);
    expect(result.timeline).toHaveLength(1);
  });
});
