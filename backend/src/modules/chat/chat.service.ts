import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LoanWorkflowLevel,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import {
  buildSupportAssignmentNotification,
  buildSupportReplyNotification,
  buildSupportResolvedNotification,
  buildSupportStaffMessageNotification,
} from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChatConversationDto, CreateChatMessageDto } from './dto';
import {
  ChatConversationDetailResult,
  ChatConversationResult,
  ChatMessageResult,
} from './interfaces';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import {
  ChatAssignment,
  ChatAssignmentDocument,
} from './schemas/chat-assignment.schema';
import {
  ChatConversation,
  ChatConversationDocument,
} from './schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import {
  ChatParticipant,
  ChatParticipantDocument,
} from './schemas/chat-participant.schema';
import {
  ChatStatusLog,
  ChatStatusLogDocument,
} from './schemas/chat-status-log.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name)
    private readonly conversationModel: Model<ChatConversationDocument>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
    @InjectModel(ChatParticipant.name)
    private readonly participantModel: Model<ChatParticipantDocument>,
    @InjectModel(ChatAssignment.name)
    private readonly assignmentModel: Model<ChatAssignmentDocument>,
    @InjectModel(ChatStatusLog.name)
    private readonly statusLogModel: Model<ChatStatusLogDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async createConversation(
    currentUser: AuthenticatedUser,
    dto: CreateChatConversationDto,
  ): Promise<ChatConversationDetailResult> {
    const loanRouting = await this.resolveLoanRouting(currentUser, dto);

    if (loanRouting.loanId) {
      const existingConversation = await this.conversationModel.findOne({
        memberId: new Types.ObjectId(currentUser.memberId ?? currentUser.sub),
        loanId: loanRouting.loanId,
        status: { $in: ['open', 'assigned', 'waiting_customer', 'waiting_agent'] },
      });

      if (existingConversation) {
        return this.getConversationDetailByDocument(existingConversation);
      }
    }

    const conversation = await this.conversationModel.create({
      memberId: new Types.ObjectId(currentUser.memberId ?? currentUser.sub),
      memberName: currentUser.fullName ?? currentUser.phone ?? 'Member',
      phoneNumber: currentUser.phone ?? '',
      memberType: currentUser.memberType,
      branchId: loanRouting.branchId,
      branchName: loanRouting.branchName,
      districtId: loanRouting.districtId,
      districtName: loanRouting.districtName,
      loanId: loanRouting.loanId,
      routingLevel: loanRouting.routingLevel,
      status: dto.initialMessage?.trim().length ? 'waiting_agent' : 'open',
      channel: 'mobile',
      category: dto.issueCategory,
      priority: this.resolvePriority(dto.issueCategory),
      lastMessageAt: new Date(),
    });

    await this.participantModel.create([
      {
        conversationId: conversation._id,
        participantType: 'customer',
        participantId: currentUser.sub,
        joinedAt: conversation.createdAt ?? new Date(),
      },
      {
        conversationId: conversation._id,
        participantType: 'system',
        participantId: 'smart-support-assistant',
        joinedAt: conversation.createdAt ?? new Date(),
      },
    ]);

    const createdMessages: ChatMessageDocument[] = [];

    if (dto.initialMessage?.trim().length) {
      createdMessages.push(
        await this.messageModel.create({
          conversationId: conversation._id,
          senderType: 'customer',
          senderId: currentUser.sub,
          senderName: currentUser.fullName ?? currentUser.phone ?? 'Customer',
          message: dto.initialMessage.trim(),
          messageType: 'text',
        }),
      );
    }

    createdMessages.push(
      await this.messageModel.create({
        conversationId: conversation._id,
        senderType: 'system',
        senderId: 'smart-support-assistant',
        senderName: 'Bunna Bank Assistant',
        message: this.buildBotResponse(dto.issueCategory),
        messageType: 'system',
      }),
    );

    await this.statusLogModel.create({
      conversationId: conversation._id,
      toStatus: conversation.status,
      changedByType: 'system',
      changedById: 'smart-support-assistant',
      note: `Conversation created for ${dto.issueCategory}${loanRouting.loanId ? ' with loan routing.' : '.'}`,
    });

    return this.toConversationDetail(conversation, createdMessages);
  }

  async listMyConversations(
    currentUser: AuthenticatedUser,
  ): Promise<ChatConversationResult[]> {
    const conversations = await this.conversationModel
      .find({ memberId: new Types.ObjectId(currentUser.memberId ?? currentUser.sub) })
      .sort({ updatedAt: -1 })
      .lean<ChatConversationDocument[]>();

    const conversationIds = conversations.map((item) => item._id);
    const latestMessages = await this.loadLatestMessages(conversationIds);

    return conversations.map((conversation) =>
      this.toConversationResult(
        conversation,
        latestMessages.get(conversation._id.toString()),
      ),
    );
  }

  async getMyConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.findCustomerConversation(
      currentUser.memberId ?? currentUser.sub,
      conversationId,
    );

    return this.getConversationDetailByDocument(conversation);
  }

  async sendCustomerMessage(
    currentUser: AuthenticatedUser,
    conversationId: string,
    dto: CreateChatMessageDto,
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.findCustomerConversation(
      currentUser.memberId ?? currentUser.sub,
      conversationId,
    );

    this.assertConversationWritable(conversation.status);

    await this.messageModel.create({
      conversationId: conversation._id,
      senderType: 'customer',
      senderId: currentUser.sub,
      senderName: currentUser.fullName ?? currentUser.phone ?? 'Customer',
      message: dto.message.trim(),
      messageType: 'text',
    });

    await this.logStatusChange(
      conversation,
      'waiting_agent',
      'customer',
      currentUser.sub,
    );
    conversation.status = 'waiting_agent';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (conversation.assignedToStaffId) {
      const notification = buildSupportStaffMessageNotification(dto.message.trim());
      await this.notificationsService.createNotification({
        userType: 'staff',
        userId: conversation.assignedToStaffId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: ChatConversation.name,
        entityId: conversation._id.toString(),
      });
    }

    return this.getConversationDetailByDocument(conversation);
  }

  async listOpenChats(
    currentUser: AuthenticatedUser,
  ): Promise<ChatConversationResult[]> {
    const conversations = await this.conversationModel
      .find({
        ...this.buildSupportConversationScope(currentUser),
        status: { $in: ['open', 'waiting_agent'] },
        assignedToStaffId: { $exists: false },
      })
      .sort({ updatedAt: -1 })
      .lean<ChatConversationDocument[]>();

    const latestMessages = await this.loadLatestMessages(
      conversations.map((item) => item._id),
    );

    return conversations.map((conversation) =>
      this.toConversationResult(
        conversation,
        latestMessages.get(conversation._id.toString()),
      ),
    );
  }

  async listAssignedChats(
    currentUser: AuthenticatedUser,
  ): Promise<ChatConversationResult[]> {
    const conversations = await this.conversationModel
      .find({
        ...this.buildSupportConversationScope(currentUser),
        assignedToStaffId: new Types.ObjectId(currentUser.sub),
        status: { $in: ['assigned', 'waiting_customer', 'waiting_agent'] },
      })
      .sort({ updatedAt: -1 })
      .lean<ChatConversationDocument[]>();

    const latestMessages = await this.loadLatestMessages(
      conversations.map((item) => item._id),
    );

    return conversations.map((conversation) =>
      this.toConversationResult(
        conversation,
        latestMessages.get(conversation._id.toString()),
      ),
    );
  }

  async getSupportConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Chat conversation not found.');
    }

    this.assertSupportConversationAccess(currentUser, conversation);

    return this.getConversationDetailByDocument(conversation);
  }

  async listResolvedChats(
    currentUser: AuthenticatedUser,
  ): Promise<ChatConversationResult[]> {
    const conversations = await this.conversationModel
      .find({
        ...this.buildSupportConversationScope(currentUser),
        ...(currentUser.role === UserRole.SUPPORT_AGENT
          ? { assignedToStaffId: new Types.ObjectId(currentUser.sub) }
          : {}),
        status: { $in: ['resolved', 'closed'] },
      })
      .sort({ updatedAt: -1 })
      .lean<ChatConversationDocument[]>();

    const latestMessages = await this.loadLatestMessages(
      conversations.map((item) => item._id),
    );

    return conversations.map((conversation) =>
      this.toConversationResult(
        conversation,
        latestMessages.get(conversation._id.toString()),
      ),
    );
  }

  async assignConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
    agentId?: string,
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Chat conversation not found.');
    }

    const assignedAgentId = agentId ?? currentUser.sub;

    conversation.assignedToStaffId = new Types.ObjectId(assignedAgentId);
    conversation.assignedToStaffName = currentUser.fullName ?? 'Support Agent';
    conversation.status = 'assigned';
    await conversation.save();

    await this.assignmentModel.create({
      conversationId: conversation._id,
      assignedToStaffId: new Types.ObjectId(assignedAgentId),
      assignedBy: new Types.ObjectId(currentUser.sub),
    });

    await this.participantModel.updateOne(
      {
        conversationId: conversation._id,
        participantType: 'agent',
        participantId: assignedAgentId,
      },
      {
        $setOnInsert: {
          joinedAt: new Date(),
        },
      },
      { upsert: true },
    );

    await this.logStatusChange(conversation, 'assigned', 'agent', currentUser.sub);
    await this.logAudit(currentUser, 'chat_assignment', conversation);
    const notification = buildSupportAssignmentNotification();
    await this.notificationsService.createNotification({
      userType: 'member',
      userId: conversation.memberId.toString(),
      type: NotificationType.SUPPORT_ASSIGNED,
      title: notification.title,
      message: notification.message,
      entityType: ChatConversation.name,
      entityId: conversation._id.toString(),
      actionLabel: 'Open support',
      priority: 'normal',
      deepLink: `/support/${conversation._id.toString()}`,
    });

    return this.getConversationDetailByDocument(conversation);
  }

  async replyAsAgent(
    currentUser: AuthenticatedUser,
    conversationId: string,
    dto: CreateChatMessageDto,
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Chat conversation not found.');
    }

    this.assertSupportConversationAccess(currentUser, conversation);
    this.assertConversationWritable(conversation.status);

    if (!conversation.assignedToStaffId) {
      conversation.assignedToStaffId = new Types.ObjectId(currentUser.sub);
      conversation.assignedToStaffName = currentUser.fullName ?? 'Support Agent';
      await this.assignmentModel.create({
        conversationId: conversation._id,
        assignedToStaffId: new Types.ObjectId(currentUser.sub),
        assignedBy: new Types.ObjectId(currentUser.sub),
      });
    }
    conversation.status = 'waiting_customer';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await this.messageModel.create({
      conversationId: conversation._id,
      senderType: 'agent',
      senderId: currentUser.sub,
      senderName: currentUser.fullName ?? 'Support Agent',
      message: dto.message.trim(),
      messageType: 'text',
    });

    const notification = buildSupportReplyNotification(dto.message.trim());
    await this.notificationsService.createNotification({
      userType: 'member',
      userId: conversation.memberId.toString(),
      type: NotificationType.SUPPORT_REPLY,
      title: notification.title,
      message: notification.message,
      entityType: ChatConversation.name,
      entityId: conversation._id.toString(),
      actionLabel: 'Open support',
      priority: 'high',
      deepLink: `/support/${conversation._id.toString()}`,
    });

    await this.logAudit(currentUser, 'chat_agent_reply', conversation);

    return this.getConversationDetailByDocument(conversation);
  }

  async resolveConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<ChatConversationDetailResult> {
    return this.updateConversationStatus(currentUser, conversationId, 'resolved');
  }

  async closeConversation(
    currentUser: AuthenticatedUser,
    conversationId: string,
  ): Promise<ChatConversationDetailResult> {
    return this.updateConversationStatus(currentUser, conversationId, 'closed');
  }

  async updateSupportConversationStatus(
    currentUser: AuthenticatedUser,
    conversationId: string,
    nextStatus:
      | 'assigned'
      | 'waiting_customer'
      | 'waiting_agent'
      | 'resolved'
      | 'closed',
  ): Promise<ChatConversationDetailResult> {
    return this.updateConversationStatus(currentUser, conversationId, nextStatus);
  }

  private async updateConversationStatus(
    currentUser: AuthenticatedUser,
    conversationId: string,
    nextStatus:
      | 'assigned'
      | 'waiting_customer'
      | 'waiting_agent'
      | 'resolved'
      | 'closed',
  ): Promise<ChatConversationDetailResult> {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Chat conversation not found.');
    }

    this.assertSupportConversationAccess(currentUser, conversation);
    const fromStatus = conversation.status;
    conversation.status = nextStatus;
    await conversation.save();

    await this.statusLogModel.create({
      conversationId: conversation._id,
      fromStatus,
      toStatus: nextStatus,
      changedByType: 'agent',
      changedById: currentUser.sub,
    });

    await this.logAudit(currentUser, `chat_${nextStatus}`, conversation);

    if (nextStatus === 'resolved') {
      const notification = buildSupportResolvedNotification();
      await this.notificationsService.createNotification({
        userType: 'member',
        userId: conversation.memberId.toString(),
        type: NotificationType.SUPPORT_REPLY,
        title: notification.title,
        message: notification.message,
        entityType: ChatConversation.name,
        entityId: conversation._id.toString(),
        actionLabel: 'Review support',
        priority: 'normal',
        deepLink: `/support/${conversation._id.toString()}`,
      });
    }

    return this.getConversationDetailByDocument(conversation);
  }

  private async findCustomerConversation(
    customerId: string,
    conversationId: string,
  ) {
    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      memberId: new Types.ObjectId(customerId),
    });

    if (!conversation) {
      throw new NotFoundException('Chat conversation not found.');
    }

    return conversation;
  }

  private async getConversationDetailByDocument(
    conversation: ChatConversationDocument,
  ): Promise<ChatConversationDetailResult> {
    const messages = await this.messageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean<ChatMessageDocument[]>();

    return this.toConversationDetail(conversation, messages);
  }

  private async loadLatestMessages(conversationIds: Types.ObjectId[]) {
    const items = await Promise.all(
      conversationIds.map(async (conversationId) => {
        const message = await this.messageModel
          .findOne({ conversationId })
          .sort({ createdAt: -1 })
          .lean<ChatMessageDocument | null>();

        return [
          conversationId.toString(),
          message ? this.toMessageResult(message) : null,
        ] as const;
      }),
    );

    return new Map(items);
  }

  private toConversationDetail(
    conversation: ChatConversationDocument | ChatConversationDocument & { id?: string },
    messages: Array<ChatMessageDocument | null>,
  ): ChatConversationDetailResult {
    const normalizedMessages = messages
      .filter((item): item is ChatMessageDocument => Boolean(item))
      .map((message) => this.toMessageResult(message));
    const latestMessage =
      normalizedMessages.length === 0
        ? undefined
        : normalizedMessages[normalizedMessages.length - 1];

    return {
      ...this.toConversationResult(conversation, latestMessage),
      messages: normalizedMessages,
    };
  }

  private toConversationResult(
    conversation: ChatConversationDocument | (ChatConversationDocument & { id?: string }),
    latestMessage?: ChatMessageResult | null,
  ): ChatConversationResult {
    const responseDueAt = this.resolveResponseDueAt(conversation);
    return {
      id: conversation.id ?? conversation._id.toString(),
      conversationId: conversation.id ?? conversation._id.toString(),
      memberId: conversation.memberId.toString(),
      customerId: conversation.memberId.toString(),
      loanId: conversation.loanId?.toString(),
      routingLevel: conversation.routingLevel,
      memberName: conversation.memberName,
      phoneNumber: conversation.phoneNumber,
      memberType: conversation.memberType,
      branchId: conversation.branchId?.toString(),
      branchName: conversation.branchName,
      districtId: conversation.districtId?.toString(),
      districtName: conversation.districtName,
      assignedToStaffId: conversation.assignedToStaffId?.toString(),
      assignedToStaffName: conversation.assignedToStaffName,
      assignedAgentId: conversation.assignedToStaffId?.toString(),
      status: conversation.status,
      channel: conversation.channel,
      category: conversation.category,
      issueCategory: conversation.category,
      priority: conversation.priority,
      escalationFlag: conversation.escalationFlag,
      responseDueAt,
      slaState: this.resolveSlaState(conversation, responseDueAt),
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      latestMessage: latestMessage ?? undefined,
    };
  }

  private toMessageResult(
    message: ChatMessageDocument | (ChatMessageDocument & { id?: string }),
  ): ChatMessageResult {
    return {
      id: message.id ?? message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderType: message.senderType,
      senderId: message.senderId,
      senderName: message.senderName,
      message: message.message,
      messageType: message.messageType,
      createdAt: message.createdAt,
      readAt: message.readAt,
    };
  }

  private buildBotResponse(issueCategory: string): string {
    switch (issueCategory) {
      case 'loan_issue':
        return 'I can help with loan status, document checks, and escalation guidance. A support agent can join if needed.';
      case 'payment_issue':
        return 'I can check payment confirmation steps and common failure causes. I can also hand this to an agent.';
      case 'insurance_issue':
        return 'I can help with insurance renewal reminders, policy status, and loan-linked insurance questions.';
      case 'kyc_issue':
        return 'I can help with KYC review, Fayda submissions, and verification follow-up.';
      default:
        return 'Welcome to Bunna Bank support. Please describe your issue and I will guide you or hand off to an agent.';
    }
  }

  private assertConversationWritable(status: string) {
    if (status === 'resolved' || status === 'closed') {
      throw new ForbiddenException('This chat conversation is no longer active.');
    }
  }

  private async logStatusChange(
    conversation: ChatConversationDocument,
    nextStatus: 'assigned' | 'waiting_customer' | 'waiting_agent',
    changedByType: 'customer' | 'agent',
    changedById: string,
  ) {
    await this.statusLogModel.create({
      conversationId: conversation._id,
      fromStatus: conversation.status,
      toStatus: nextStatus,
      changedByType,
      changedById,
    });
  }

  private async logAudit(
    currentUser: AuthenticatedUser,
    actionType: string,
    conversation: ChatConversationDocument,
  ) {
    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType,
      entityType: ChatConversation.name,
      entityId: conversation._id.toString(),
      before: null,
      after: {
        status: conversation.status,
        assignedToStaffId: conversation.assignedToStaffId?.toString(),
      },
    });
  }

  private resolvePriority(category: string): 'low' | 'normal' | 'high' {
    if (category === 'loan_issue') {
      return 'high';
    }
    if (category === 'payment_issue' || category === 'insurance_issue') {
      return 'normal';
    }
    return 'low';
  }

  private resolveResponseDueAt(
    conversation:
      | ChatConversationDocument
      | (ChatConversationDocument & { id?: string }),
  ) {
    const baseline =
      conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;
    if (!baseline) {
      return undefined;
    }

    const minutes =
      conversation.priority === 'high'
        ? 20
        : conversation.priority === 'normal'
          ? 45
          : 90;

    return new Date(baseline.getTime() + minutes * 60_000);
  }

  private resolveSlaState(
    conversation:
      | ChatConversationDocument
      | (ChatConversationDocument & { id?: string }),
    responseDueAt?: Date,
  ): 'on_track' | 'attention' | 'breached' {
    if (
      conversation.status === 'resolved' ||
      conversation.status === 'closed' ||
      !responseDueAt
    ) {
      return 'on_track';
    }

    const dueAt = responseDueAt.getTime();
    const now = Date.now();

    if (dueAt <= now) {
      return 'breached';
    }

    if (conversation.escalationFlag || dueAt - now <= 15 * 60_000) {
      return 'attention';
    }

    return 'on_track';
  }

  private assertSupportConversationAccess(
    currentUser: AuthenticatedUser,
    conversation: ChatConversationDocument,
  ) {
    if (
      currentUser.role === UserRole.BRANCH_MANAGER &&
      (!['general', 'branch'].includes(conversation.routingLevel) ||
          !currentUser.branchId ||
          conversation.branchId?.toString() !== currentUser.branchId)
    ) {
      throw new ForbiddenException(
        'This support conversation is outside your branch scope.',
      );
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      (!['general', 'district'].includes(conversation.routingLevel) ||
          !currentUser.districtId ||
          conversation.districtId?.toString() !== currentUser.districtId)
    ) {
      throw new ForbiddenException(
        'This support conversation is outside your district scope.',
      );
    }

    if (currentUser.role !== UserRole.SUPPORT_AGENT) {
      return;
    }

    const assignedToStaffId = conversation.assignedToStaffId?.toString();
    if (assignedToStaffId == null || assignedToStaffId.length === 0) {
      return;
    }

    if (assignedToStaffId !== currentUser.sub) {
      throw new ForbiddenException(
        'This support conversation is assigned to another agent.',
      );
    }
  }

  private buildSupportConversationScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return {
        branchId: new Types.ObjectId(currentUser.branchId),
        routingLevel: { $in: ['general', 'branch'] },
      };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return {
        districtId: new Types.ObjectId(currentUser.districtId),
        routingLevel: { $in: ['general', 'district'] },
      };
    }

    return {};
  }

  private async resolveLoanRouting(
    currentUser: AuthenticatedUser,
    dto: CreateChatConversationDto,
  ): Promise<{
    loanId?: Types.ObjectId;
    branchId?: Types.ObjectId;
    branchName?: string;
    districtId?: Types.ObjectId;
    districtName?: string;
    routingLevel: 'general' | 'branch' | 'district' | 'head_office';
  }> {
    if (dto.issueCategory !== 'loan_issue' || !dto.loanId) {
      return {
        branchId: currentUser.branchId ? new Types.ObjectId(currentUser.branchId) : undefined,
        branchName: currentUser.branchName,
        districtId: currentUser.districtId ? new Types.ObjectId(currentUser.districtId) : undefined,
        districtName: currentUser.districtName,
        routingLevel: 'general',
      };
    }

    const loan = await this.loanModel.findById(dto.loanId).lean<LoanDocument | null>();

    if (!loan || loan.memberId.toString() !== (currentUser.memberId ?? currentUser.sub)) {
      throw new NotFoundException('Loan not found for this member.');
    }

    if (loan.currentLevel === LoanWorkflowLevel.BRANCH) {
      return {
        loanId: loan._id,
        branchId: loan.branchId,
        branchName: currentUser.branchName,
        districtId: loan.districtId,
        districtName: currentUser.districtName,
        routingLevel: 'branch',
      };
    }

    if (loan.currentLevel === LoanWorkflowLevel.DISTRICT) {
      return {
        loanId: loan._id,
        districtId: loan.districtId,
        districtName: currentUser.districtName,
        routingLevel: 'district',
      };
    }

    if (loan.currentLevel === LoanWorkflowLevel.HEAD_OFFICE) {
      return {
        loanId: loan._id,
        routingLevel: 'head_office',
      };
    }

    return {
      loanId: loan._id,
      branchId: loan.branchId,
      branchName: currentUser.branchName,
      districtId: loan.districtId,
      districtName: currentUser.districtName,
      routingLevel: 'branch',
    };
  }
}
