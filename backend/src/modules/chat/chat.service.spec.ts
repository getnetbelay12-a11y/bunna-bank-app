import { Types } from 'mongoose';

import { MemberType, NotificationType, UserRole } from '../../common/enums';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatService } from './chat.service';
import { ChatIssueCategory } from './dto';

function createModelMock() {
  return {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  const conversationModel = createModelMock();
  const loanModel = createModelMock();
  const messageModel = createModelMock();
  const participantModel = createModelMock();
  const assignmentModel = createModelMock();
  const statusLogModel = createModelMock();
  const notificationsService = {
    createNotification: jest.fn(),
  } as unknown as jest.Mocked<NotificationsService>;
  const auditService = {
    logActorAction: jest.fn(),
  } as unknown as jest.Mocked<AuditService>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ChatService(
      conversationModel as never,
      loanModel as never,
      messageModel as never,
      participantModel as never,
      assignmentModel as never,
      statusLogModel as never,
      notificationsService,
      auditService,
    );
  });

  it('creates a conversation with an initial bot response', async () => {
    const conversationId = new Types.ObjectId();
    const customerId = new Types.ObjectId();

    conversationModel.create.mockResolvedValue({
      _id: conversationId,
      memberId: customerId,
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      memberType: MemberType.SHAREHOLDER,
      status: 'waiting_agent',
      channel: 'mobile',
      category: ChatIssueCategory.LOAN_ISSUE,
      routingLevel: 'general',
      escalationFlag: false,
      createdAt: new Date('2026-03-11T10:00:00Z'),
      updatedAt: new Date('2026-03-11T10:00:00Z'),
    });
    participantModel.create.mockResolvedValue(undefined);
    messageModel.create
      .mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        conversationId,
        senderType: 'customer',
        senderId: customerId.toString(),
        message: 'My loan status is unclear.',
        messageType: 'text',
        createdAt: new Date('2026-03-11T10:01:00Z'),
      })
      .mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        conversationId,
        senderType: 'bot',
        senderId: 'smart-support-assistant',
        message: 'Bot reply',
        messageType: 'system',
        createdAt: new Date('2026-03-11T10:02:00Z'),
      });
    statusLogModel.create.mockResolvedValue(undefined);

    const result = await service.createConversation(
      {
        sub: customerId.toString(),
        role: UserRole.SHAREHOLDER_MEMBER,
        memberType: MemberType.SHAREHOLDER,
      } as never,
      {
        issueCategory: ChatIssueCategory.LOAN_ISSUE,
        initialMessage: 'My loan status is unclear.',
      },
    );

    expect(result.status).toBe('waiting_agent');
    expect(result.messages).toHaveLength(2);
    expect(participantModel.create).toHaveBeenCalled();
  });

  it('routes loan support chats to the district queue when the loan is at district review', async () => {
    const conversationId = new Types.ObjectId();
    const customerId = new Types.ObjectId();
    const districtId = new Types.ObjectId();
    const loanId = new Types.ObjectId();

    loanModel.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: loanId,
        memberId: customerId,
        branchId: new Types.ObjectId(),
        districtId,
        currentLevel: 'district',
      }),
    });
    conversationModel.findOne.mockResolvedValue(null);
    conversationModel.create.mockResolvedValue({
      _id: conversationId,
      memberId: customerId,
      memberName: 'Abebe Kebede',
      phoneNumber: '0911000001',
      memberType: MemberType.MEMBER,
      status: 'waiting_agent',
      channel: 'mobile',
      category: ChatIssueCategory.LOAN_ISSUE,
      loanId,
      routingLevel: 'district',
      districtId,
      escalationFlag: false,
      createdAt: new Date('2026-03-11T10:00:00Z'),
      updatedAt: new Date('2026-03-11T10:00:00Z'),
    });
    participantModel.create.mockResolvedValue(undefined);
    messageModel.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      conversationId,
      senderType: 'system',
      senderId: 'smart-support-assistant',
      message: 'Bot reply',
      messageType: 'system',
      createdAt: new Date('2026-03-11T10:02:00Z'),
    });
    statusLogModel.create.mockResolvedValue(undefined);

    const result = await service.createConversation(
      {
        sub: customerId.toString(),
        memberId: customerId.toString(),
        role: UserRole.MEMBER,
        memberType: MemberType.MEMBER,
        districtId: districtId.toString(),
      } as never,
      {
        issueCategory: ChatIssueCategory.LOAN_ISSUE,
        loanId: loanId.toString(),
      },
    );

    expect(conversationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        loanId,
        routingLevel: 'district',
        branchId: undefined,
        districtId,
      }),
    );
    expect(result.routingLevel).toBe('district');
  });

  it('assigns an open conversation to an agent', async () => {
    const conversationId = new Types.ObjectId();
    const customerId = new Types.ObjectId();
    const agentId = new Types.ObjectId();
    const save = jest.fn();

    conversationModel.findById.mockResolvedValue({
      _id: conversationId,
      memberId: customerId,
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000002',
      memberType: MemberType.MEMBER,
      status: 'waiting_agent',
      channel: 'mobile',
      category: ChatIssueCategory.KYC_ISSUE,
      escalationFlag: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      save,
    });
    assignmentModel.create.mockResolvedValue(undefined);
    participantModel.updateOne.mockResolvedValue(undefined);
    statusLogModel.create.mockResolvedValue(undefined);
    auditService.logActorAction.mockResolvedValue({} as never);
    messageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const result = await service.assignConversation(
      {
        sub: agentId.toString(),
        role: UserRole.SUPPORT_AGENT,
      } as never,
      conversationId.toString(),
    );

    expect(save).toHaveBeenCalled();
    expect(result.assignedAgentId).toBe(agentId.toString());
    expect(assignmentModel.create).toHaveBeenCalled();
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerId.toString(),
        type: NotificationType.SUPPORT_ASSIGNED,
        actionLabel: 'Open support',
        priority: 'normal',
        deepLink: `/support/${conversationId.toString()}`,
      }),
    );
  });

  it('notifies the customer when an agent replies', async () => {
    const conversationId = new Types.ObjectId();
    const customerId = new Types.ObjectId();
    const agentId = new Types.ObjectId();
    const save = jest.fn();

    conversationModel.findById.mockResolvedValue({
      _id: conversationId,
      memberId: customerId,
      memberName: 'Meseret Alemu',
      phoneNumber: '0911000002',
      assignedToStaffId: agentId,
      memberType: MemberType.MEMBER,
      status: 'assigned',
      channel: 'mobile',
      category: ChatIssueCategory.GENERAL_HELP,
      escalationFlag: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      save,
    });
    messageModel.create.mockResolvedValue(undefined);
    messageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    notificationsService.createNotification.mockResolvedValue({} as never);
    auditService.logActorAction.mockResolvedValue({} as never);

    await service.replyAsAgent(
      {
        sub: agentId.toString(),
        role: UserRole.SUPPORT_AGENT,
      } as never,
      conversationId.toString(),
      { message: 'An agent has picked up your chat.' },
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: customerId.toString(),
        type: NotificationType.SUPPORT_REPLY,
        actionLabel: 'Open support',
        priority: 'high',
        deepLink: `/support/${conversationId.toString()}`,
      }),
    );
  });
});
