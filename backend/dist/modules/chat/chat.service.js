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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const notifications_service_1 = require("../notifications/notifications.service");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const chat_assignment_schema_1 = require("./schemas/chat-assignment.schema");
const chat_conversation_schema_1 = require("./schemas/chat-conversation.schema");
const chat_message_schema_1 = require("./schemas/chat-message.schema");
const chat_participant_schema_1 = require("./schemas/chat-participant.schema");
const chat_status_log_schema_1 = require("./schemas/chat-status-log.schema");
let ChatService = class ChatService {
    constructor(conversationModel, loanModel, messageModel, participantModel, assignmentModel, statusLogModel, notificationsService, auditService) {
        this.conversationModel = conversationModel;
        this.loanModel = loanModel;
        this.messageModel = messageModel;
        this.participantModel = participantModel;
        this.assignmentModel = assignmentModel;
        this.statusLogModel = statusLogModel;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async createConversation(currentUser, dto) {
        const loanRouting = await this.resolveLoanRouting(currentUser, dto);
        if (loanRouting.loanId) {
            const existingConversation = await this.conversationModel.findOne({
                memberId: new mongoose_2.Types.ObjectId(currentUser.memberId ?? currentUser.sub),
                loanId: loanRouting.loanId,
                status: { $in: ['open', 'assigned', 'waiting_customer', 'waiting_agent'] },
            });
            if (existingConversation) {
                return this.getConversationDetailByDocument(existingConversation);
            }
        }
        const conversation = await this.conversationModel.create({
            memberId: new mongoose_2.Types.ObjectId(currentUser.memberId ?? currentUser.sub),
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
        const createdMessages = [];
        if (dto.initialMessage?.trim().length) {
            createdMessages.push(await this.messageModel.create({
                conversationId: conversation._id,
                senderType: 'customer',
                senderId: currentUser.sub,
                senderName: currentUser.fullName ?? currentUser.phone ?? 'Customer',
                message: dto.initialMessage.trim(),
                messageType: 'text',
            }));
        }
        createdMessages.push(await this.messageModel.create({
            conversationId: conversation._id,
            senderType: 'system',
            senderId: 'smart-support-assistant',
            senderName: 'Bunna Bank Assistant',
            message: this.buildBotResponse(dto.issueCategory),
            messageType: 'system',
        }));
        await this.statusLogModel.create({
            conversationId: conversation._id,
            toStatus: conversation.status,
            changedByType: 'system',
            changedById: 'smart-support-assistant',
            note: `Conversation created for ${dto.issueCategory}${loanRouting.loanId ? ' with loan routing.' : '.'}`,
        });
        return this.toConversationDetail(conversation, createdMessages);
    }
    async listMyConversations(currentUser) {
        const conversations = await this.conversationModel
            .find({ memberId: new mongoose_2.Types.ObjectId(currentUser.memberId ?? currentUser.sub) })
            .sort({ updatedAt: -1 })
            .lean();
        const conversationIds = conversations.map((item) => item._id);
        const latestMessages = await this.loadLatestMessages(conversationIds);
        return conversations.map((conversation) => this.toConversationResult(conversation, latestMessages.get(conversation._id.toString())));
    }
    async getMyConversation(currentUser, conversationId) {
        const conversation = await this.findCustomerConversation(currentUser.memberId ?? currentUser.sub, conversationId);
        return this.getConversationDetailByDocument(conversation);
    }
    async sendCustomerMessage(currentUser, conversationId, dto) {
        const conversation = await this.findCustomerConversation(currentUser.memberId ?? currentUser.sub, conversationId);
        this.assertConversationWritable(conversation.status);
        await this.messageModel.create({
            conversationId: conversation._id,
            senderType: 'customer',
            senderId: currentUser.sub,
            senderName: currentUser.fullName ?? currentUser.phone ?? 'Customer',
            message: dto.message.trim(),
            messageType: 'text',
        });
        await this.logStatusChange(conversation, 'waiting_agent', 'customer', currentUser.sub);
        conversation.status = 'waiting_agent';
        conversation.lastMessageAt = new Date();
        await conversation.save();
        if (conversation.assignedToStaffId) {
            const notification = (0, banking_notification_builders_1.buildSupportStaffMessageNotification)(dto.message.trim());
            await this.notificationsService.createNotification({
                userType: 'staff',
                userId: conversation.assignedToStaffId.toString(),
                type: notification.type,
                title: notification.title,
                message: notification.message,
                entityType: chat_conversation_schema_1.ChatConversation.name,
                entityId: conversation._id.toString(),
            });
        }
        return this.getConversationDetailByDocument(conversation);
    }
    async listOpenChats(currentUser) {
        const conversations = await this.conversationModel
            .find({
            ...this.buildSupportConversationScope(currentUser),
            status: { $in: ['open', 'waiting_agent'] },
            assignedToStaffId: { $exists: false },
        })
            .sort({ updatedAt: -1 })
            .lean();
        const latestMessages = await this.loadLatestMessages(conversations.map((item) => item._id));
        return conversations.map((conversation) => this.toConversationResult(conversation, latestMessages.get(conversation._id.toString())));
    }
    async listAssignedChats(currentUser) {
        const conversations = await this.conversationModel
            .find({
            ...this.buildSupportConversationScope(currentUser),
            assignedToStaffId: new mongoose_2.Types.ObjectId(currentUser.sub),
            status: { $in: ['assigned', 'waiting_customer', 'waiting_agent'] },
        })
            .sort({ updatedAt: -1 })
            .lean();
        const latestMessages = await this.loadLatestMessages(conversations.map((item) => item._id));
        return conversations.map((conversation) => this.toConversationResult(conversation, latestMessages.get(conversation._id.toString())));
    }
    async getSupportConversation(currentUser, conversationId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Chat conversation not found.');
        }
        this.assertSupportConversationAccess(currentUser, conversation);
        return this.getConversationDetailByDocument(conversation);
    }
    async listResolvedChats(currentUser) {
        const conversations = await this.conversationModel
            .find({
            ...this.buildSupportConversationScope(currentUser),
            ...(currentUser.role === enums_1.UserRole.SUPPORT_AGENT
                ? { assignedToStaffId: new mongoose_2.Types.ObjectId(currentUser.sub) }
                : {}),
            status: { $in: ['resolved', 'closed'] },
        })
            .sort({ updatedAt: -1 })
            .lean();
        const latestMessages = await this.loadLatestMessages(conversations.map((item) => item._id));
        return conversations.map((conversation) => this.toConversationResult(conversation, latestMessages.get(conversation._id.toString())));
    }
    async assignConversation(currentUser, conversationId, agentId) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Chat conversation not found.');
        }
        const assignedAgentId = agentId ?? currentUser.sub;
        conversation.assignedToStaffId = new mongoose_2.Types.ObjectId(assignedAgentId);
        conversation.assignedToStaffName = currentUser.fullName ?? 'Support Agent';
        conversation.status = 'assigned';
        await conversation.save();
        await this.assignmentModel.create({
            conversationId: conversation._id,
            assignedToStaffId: new mongoose_2.Types.ObjectId(assignedAgentId),
            assignedBy: new mongoose_2.Types.ObjectId(currentUser.sub),
        });
        await this.participantModel.updateOne({
            conversationId: conversation._id,
            participantType: 'agent',
            participantId: assignedAgentId,
        }, {
            $setOnInsert: {
                joinedAt: new Date(),
            },
        }, { upsert: true });
        await this.logStatusChange(conversation, 'assigned', 'agent', currentUser.sub);
        await this.logAudit(currentUser, 'chat_assignment', conversation);
        const notification = (0, banking_notification_builders_1.buildSupportAssignmentNotification)();
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: conversation.memberId.toString(),
            type: enums_1.NotificationType.SUPPORT_ASSIGNED,
            title: notification.title,
            message: notification.message,
            entityType: chat_conversation_schema_1.ChatConversation.name,
            entityId: conversation._id.toString(),
            actionLabel: 'Open support',
            priority: 'normal',
            deepLink: `/support/${conversation._id.toString()}`,
        });
        return this.getConversationDetailByDocument(conversation);
    }
    async replyAsAgent(currentUser, conversationId, dto) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Chat conversation not found.');
        }
        this.assertSupportConversationAccess(currentUser, conversation);
        this.assertConversationWritable(conversation.status);
        if (!conversation.assignedToStaffId) {
            conversation.assignedToStaffId = new mongoose_2.Types.ObjectId(currentUser.sub);
            conversation.assignedToStaffName = currentUser.fullName ?? 'Support Agent';
            await this.assignmentModel.create({
                conversationId: conversation._id,
                assignedToStaffId: new mongoose_2.Types.ObjectId(currentUser.sub),
                assignedBy: new mongoose_2.Types.ObjectId(currentUser.sub),
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
        const notification = (0, banking_notification_builders_1.buildSupportReplyNotification)(dto.message.trim());
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: conversation.memberId.toString(),
            type: enums_1.NotificationType.SUPPORT_REPLY,
            title: notification.title,
            message: notification.message,
            entityType: chat_conversation_schema_1.ChatConversation.name,
            entityId: conversation._id.toString(),
            actionLabel: 'Open support',
            priority: 'high',
            deepLink: `/support/${conversation._id.toString()}`,
        });
        await this.logAudit(currentUser, 'chat_agent_reply', conversation);
        return this.getConversationDetailByDocument(conversation);
    }
    async resolveConversation(currentUser, conversationId) {
        return this.updateConversationStatus(currentUser, conversationId, 'resolved');
    }
    async closeConversation(currentUser, conversationId) {
        return this.updateConversationStatus(currentUser, conversationId, 'closed');
    }
    async updateSupportConversationStatus(currentUser, conversationId, nextStatus) {
        return this.updateConversationStatus(currentUser, conversationId, nextStatus);
    }
    async updateConversationStatus(currentUser, conversationId, nextStatus) {
        const conversation = await this.conversationModel.findById(conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('Chat conversation not found.');
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
            const notification = (0, banking_notification_builders_1.buildSupportResolvedNotification)();
            await this.notificationsService.createNotification({
                userType: 'member',
                userId: conversation.memberId.toString(),
                type: enums_1.NotificationType.SUPPORT_REPLY,
                title: notification.title,
                message: notification.message,
                entityType: chat_conversation_schema_1.ChatConversation.name,
                entityId: conversation._id.toString(),
                actionLabel: 'Review support',
                priority: 'normal',
                deepLink: `/support/${conversation._id.toString()}`,
            });
        }
        return this.getConversationDetailByDocument(conversation);
    }
    async findCustomerConversation(customerId, conversationId) {
        const conversation = await this.conversationModel.findOne({
            _id: new mongoose_2.Types.ObjectId(conversationId),
            memberId: new mongoose_2.Types.ObjectId(customerId),
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Chat conversation not found.');
        }
        return conversation;
    }
    async getConversationDetailByDocument(conversation) {
        const messages = await this.messageModel
            .find({ conversationId: conversation._id })
            .sort({ createdAt: 1 })
            .lean();
        return this.toConversationDetail(conversation, messages);
    }
    async loadLatestMessages(conversationIds) {
        const items = await Promise.all(conversationIds.map(async (conversationId) => {
            const message = await this.messageModel
                .findOne({ conversationId })
                .sort({ createdAt: -1 })
                .lean();
            return [
                conversationId.toString(),
                message ? this.toMessageResult(message) : null,
            ];
        }));
        return new Map(items);
    }
    toConversationDetail(conversation, messages) {
        const normalizedMessages = messages
            .filter((item) => Boolean(item))
            .map((message) => this.toMessageResult(message));
        const latestMessage = normalizedMessages.length === 0
            ? undefined
            : normalizedMessages[normalizedMessages.length - 1];
        return {
            ...this.toConversationResult(conversation, latestMessage),
            messages: normalizedMessages,
        };
    }
    toConversationResult(conversation, latestMessage) {
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
    toMessageResult(message) {
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
    buildBotResponse(issueCategory) {
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
    assertConversationWritable(status) {
        if (status === 'resolved' || status === 'closed') {
            throw new common_1.ForbiddenException('This chat conversation is no longer active.');
        }
    }
    async logStatusChange(conversation, nextStatus, changedByType, changedById) {
        await this.statusLogModel.create({
            conversationId: conversation._id,
            fromStatus: conversation.status,
            toStatus: nextStatus,
            changedByType,
            changedById,
        });
    }
    async logAudit(currentUser, actionType, conversation) {
        await this.auditService.logActorAction({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType,
            entityType: chat_conversation_schema_1.ChatConversation.name,
            entityId: conversation._id.toString(),
            before: null,
            after: {
                status: conversation.status,
                assignedToStaffId: conversation.assignedToStaffId?.toString(),
            },
        });
    }
    resolvePriority(category) {
        if (category === 'loan_issue') {
            return 'high';
        }
        if (category === 'payment_issue' || category === 'insurance_issue') {
            return 'normal';
        }
        return 'low';
    }
    resolveResponseDueAt(conversation) {
        const baseline = conversation.lastMessageAt ?? conversation.updatedAt ?? conversation.createdAt;
        if (!baseline) {
            return undefined;
        }
        const minutes = conversation.priority === 'high'
            ? 20
            : conversation.priority === 'normal'
                ? 45
                : 90;
        return new Date(baseline.getTime() + minutes * 60_000);
    }
    resolveSlaState(conversation, responseDueAt) {
        if (conversation.status === 'resolved' ||
            conversation.status === 'closed' ||
            !responseDueAt) {
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
    assertSupportConversationAccess(currentUser, conversation) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER &&
            (!['general', 'branch'].includes(conversation.routingLevel) ||
                !currentUser.branchId ||
                conversation.branchId?.toString() !== currentUser.branchId)) {
            throw new common_1.ForbiddenException('This support conversation is outside your branch scope.');
        }
        if ([enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
            (!['general', 'district'].includes(conversation.routingLevel) ||
                !currentUser.districtId ||
                conversation.districtId?.toString() !== currentUser.districtId)) {
            throw new common_1.ForbiddenException('This support conversation is outside your district scope.');
        }
        if (currentUser.role !== enums_1.UserRole.SUPPORT_AGENT) {
            return;
        }
        const assignedToStaffId = conversation.assignedToStaffId?.toString();
        if (assignedToStaffId == null || assignedToStaffId.length === 0) {
            return;
        }
        if (assignedToStaffId !== currentUser.sub) {
            throw new common_1.ForbiddenException('This support conversation is assigned to another agent.');
        }
    }
    buildSupportConversationScope(currentUser) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            return {
                branchId: new mongoose_2.Types.ObjectId(currentUser.branchId),
                routingLevel: { $in: ['general', 'branch'] },
            };
        }
        if ([enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
            currentUser.districtId) {
            return {
                districtId: new mongoose_2.Types.ObjectId(currentUser.districtId),
                routingLevel: { $in: ['general', 'district'] },
            };
        }
        return {};
    }
    async resolveLoanRouting(currentUser, dto) {
        if (dto.issueCategory !== 'loan_issue' || !dto.loanId) {
            return {
                branchId: currentUser.branchId ? new mongoose_2.Types.ObjectId(currentUser.branchId) : undefined,
                branchName: currentUser.branchName,
                districtId: currentUser.districtId ? new mongoose_2.Types.ObjectId(currentUser.districtId) : undefined,
                districtName: currentUser.districtName,
                routingLevel: 'general',
            };
        }
        const loan = await this.loanModel.findById(dto.loanId).lean();
        if (!loan || loan.memberId.toString() !== (currentUser.memberId ?? currentUser.sub)) {
            throw new common_1.NotFoundException('Loan not found for this member.');
        }
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.BRANCH) {
            return {
                loanId: loan._id,
                branchId: loan.branchId,
                branchName: currentUser.branchName,
                districtId: loan.districtId,
                districtName: currentUser.districtName,
                routingLevel: 'branch',
            };
        }
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.DISTRICT) {
            return {
                loanId: loan._id,
                districtId: loan.districtId,
                districtName: currentUser.districtName,
                routingLevel: 'district',
            };
        }
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.HEAD_OFFICE) {
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
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_conversation_schema_1.ChatConversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(2, (0, mongoose_1.InjectModel)(chat_message_schema_1.ChatMessage.name)),
    __param(3, (0, mongoose_1.InjectModel)(chat_participant_schema_1.ChatParticipant.name)),
    __param(4, (0, mongoose_1.InjectModel)(chat_assignment_schema_1.ChatAssignment.name)),
    __param(5, (0, mongoose_1.InjectModel)(chat_status_log_schema_1.ChatStatusLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], ChatService);
//# sourceMappingURL=chat.service.js.map