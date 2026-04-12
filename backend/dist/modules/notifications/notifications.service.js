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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const notification_provider_port_1 = require("./notification-provider.port");
const notification_schema_1 = require("./schemas/notification.schema");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notificationModel, notificationProvider) {
        this.notificationModel = notificationModel;
        this.notificationProvider = notificationProvider;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async createNotification(dto) {
        let dispatchResult;
        try {
            dispatchResult = await this.notificationProvider.dispatch({
                userType: dto.userType,
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                message: dto.message,
                priority: dto.priority,
                actionLabel: dto.actionLabel,
                deepLink: dto.deepLink,
                dataPayload: dto.dataPayload,
                preferredChannel: dto.channel,
            });
        }
        catch (error) {
            this.logger.warn(`Notification dispatch failed for ${dto.userType}:${dto.userId}.`, error instanceof Error ? error.stack : undefined);
        }
        return this.storeNotificationRecord({
            ...dto,
            channel: dto.channel ??
                dispatchResult?.channel ??
                enums_1.NotificationChannel.MOBILE_PUSH,
            status: dto.status ?? dispatchResult?.status ?? enums_1.NotificationStatus.FAILED,
            deliveredAt: dispatchResult?.deliveredAt,
        });
    }
    async notifyStaffSecurityBreachDigest(input) {
        const cutoff = new Date(Date.now() - NotificationsService_1.SECURITY_BREACH_DIGEST_WINDOW_MS);
        const existing = await this.notificationModel
            .findOne({
            userType: 'staff',
            userId: new mongoose_2.Types.ObjectId(input.userId),
            type: enums_1.NotificationType.SYSTEM,
            title: 'Security review SLA breached',
            priority: 'high',
            status: { $ne: enums_1.NotificationStatus.READ },
            createdAt: { $gte: cutoff },
        })
            .sort({ createdAt: -1 });
        if (!existing) {
            return this.createNotification({
                userType: 'staff',
                userId: input.userId,
                userRole: input.userRole,
                type: enums_1.NotificationType.SYSTEM,
                title: 'Security review SLA breached',
                message: '1 security review SLA breach requires head office attention.',
                entityType: 'service_request',
                entityId: input.serviceRequestId,
                actionLabel: 'Open security review',
                priority: 'high',
                deepLink: '/console/head-office?section=serviceRequests',
                dataPayload: {
                    securityBreachDigestCount: 1,
                    serviceRequestIds: [input.serviceRequestId],
                    latestServiceRequestId: input.serviceRequestId,
                    escalationState: 'breached_head_office_attention_required',
                },
            });
        }
        const currentIds = Array.isArray(existing.dataPayload?.serviceRequestIds)
            ? existing.dataPayload?.serviceRequestIds.filter((value) => typeof value === 'string' && value.trim().length > 0)
            : [];
        const nextIds = Array.from(new Set([...currentIds, input.serviceRequestId]));
        const nextCount = typeof existing.dataPayload?.securityBreachDigestCount === 'number'
            ? Math.max(existing.dataPayload.securityBreachDigestCount, nextIds.length)
            : nextIds.length;
        existing.message = `${nextCount} security review SLA breaches require head office attention.`;
        existing.entityType = 'service_request';
        existing.entityId = new mongoose_2.Types.ObjectId(input.serviceRequestId);
        existing.actionLabel = 'Open security review';
        existing.priority = 'high';
        existing.deepLink = '/console/head-office?section=serviceRequests';
        existing.dataPayload = {
            ...(existing.dataPayload ?? {}),
            securityBreachDigestCount: nextCount,
            serviceRequestIds: nextIds,
            latestServiceRequestId: input.serviceRequestId,
            escalationState: 'breached_head_office_attention_required',
        };
        await existing.save();
        return this.toResult(existing);
    }
    async notifyStaffSecurityInvestigationStalledDigest(input) {
        const cutoff = new Date(Date.now() - NotificationsService_1.SECURITY_STALL_DIGEST_WINDOW_MS);
        const existing = await this.notificationModel
            .findOne({
            userType: 'staff',
            userId: new mongoose_2.Types.ObjectId(input.userId),
            type: enums_1.NotificationType.SYSTEM,
            title: 'Security investigation stalled',
            priority: 'high',
            status: { $ne: enums_1.NotificationStatus.READ },
            createdAt: { $gte: cutoff },
        })
            .sort({ createdAt: -1 });
        if (!existing) {
            return this.createNotification({
                userType: 'staff',
                userId: input.userId,
                userRole: input.userRole,
                type: enums_1.NotificationType.SYSTEM,
                title: 'Security investigation stalled',
                message: '1 acknowledged security review still has no active investigation.',
                entityType: 'service_request',
                entityId: input.serviceRequestId,
                actionLabel: 'Open stalled review',
                priority: 'high',
                deepLink: '/console/head-office?section=serviceRequests',
                dataPayload: {
                    securityInvestigationStallCount: 1,
                    serviceRequestIds: [input.serviceRequestId],
                    latestServiceRequestId: input.serviceRequestId,
                    escalationState: 'acknowledged_but_investigation_not_started',
                },
            });
        }
        const currentIds = Array.isArray(existing.dataPayload?.serviceRequestIds)
            ? existing.dataPayload?.serviceRequestIds.filter((value) => typeof value === 'string' && value.trim().length > 0)
            : [];
        const nextIds = Array.from(new Set([...currentIds, input.serviceRequestId]));
        const nextCount = typeof existing.dataPayload?.securityInvestigationStallCount === 'number'
            ? Math.max(existing.dataPayload.securityInvestigationStallCount, nextIds.length)
            : nextIds.length;
        existing.message = `${nextCount} acknowledged security reviews still have no active investigation.`;
        existing.entityType = 'service_request';
        existing.entityId = new mongoose_2.Types.ObjectId(input.serviceRequestId);
        existing.actionLabel = 'Open stalled review';
        existing.priority = 'high';
        existing.deepLink = '/console/head-office?section=serviceRequests';
        existing.dataPayload = {
            ...(existing.dataPayload ?? {}),
            securityInvestigationStallCount: nextCount,
            serviceRequestIds: nextIds,
            latestServiceRequestId: input.serviceRequestId,
            escalationState: 'acknowledged_but_investigation_not_started',
        };
        await existing.save();
        return this.toResult(existing);
    }
    async storeNotificationRecord(dto) {
        const notification = await this.notificationModel.create({
            userType: dto.userType,
            userId: new mongoose_2.Types.ObjectId(dto.userId),
            userRole: dto.userRole,
            type: dto.type,
            channel: dto.channel ?? enums_1.NotificationChannel.MOBILE_PUSH,
            status: dto.status ?? enums_1.NotificationStatus.PENDING,
            title: dto.title,
            message: dto.message,
            entityType: dto.entityType,
            entityId: dto.entityId ? new mongoose_2.Types.ObjectId(dto.entityId) : undefined,
            actionLabel: dto.actionLabel,
            priority: dto.priority,
            deepLink: dto.deepLink,
            dataPayload: dto.dataPayload,
            deliveredAt: dto.deliveredAt,
        });
        return this.toResult(notification);
    }
    async getMyNotifications(currentUser) {
        return this.listNotifications({
            userId: currentUser.sub,
            userType: this.resolveUserType(currentUser.role),
        });
    }
    async listNotifications(query, currentUser) {
        if (currentUser && !this.isStaffRole(currentUser.role)) {
            throw new common_1.ForbiddenException('Only staff users can list notifications by user.');
        }
        const filter = {};
        if (query.userId) {
            filter.userId = new mongoose_2.Types.ObjectId(query.userId);
        }
        if (query.userType) {
            filter.userType = query.userType;
        }
        if (query.type) {
            filter.type = query.type;
        }
        if (query.status) {
            filter.status = query.status;
        }
        const notifications = await this.notificationModel
            .find(filter)
            .sort({ createdAt: -1 })
            .lean();
        return notifications.map((notification) => this.toResult(notification));
    }
    async markAsRead(currentUser, notificationId) {
        const notification = await this.notificationModel.findById(notificationId);
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found.');
        }
        const expectedUserType = this.resolveUserType(currentUser.role);
        if (notification.userId.toString() !== currentUser.sub ||
            notification.userType !== expectedUserType) {
            throw new common_1.ForbiddenException('Notification does not belong to the current user.');
        }
        notification.status = enums_1.NotificationStatus.READ;
        notification.readAt = new Date();
        await notification.save();
        return this.toResult(notification);
    }
    resolveUserType(role) {
        return role === enums_1.UserRole.MEMBER || role === enums_1.UserRole.SHAREHOLDER_MEMBER
            ? 'member'
            : 'staff';
    }
    isStaffRole(role) {
        return this.resolveUserType(role) === 'staff';
    }
    toResult(notification) {
        return {
            id: notification.id ?? notification._id.toString(),
            userType: notification.userType,
            userId: notification.userId.toString(),
            userRole: notification.userRole,
            type: notification.type,
            channel: (notification.channel ??
                enums_1.NotificationChannel.MOBILE_PUSH),
            status: notification.status,
            title: notification.title,
            message: notification.message,
            entityType: notification.entityType,
            entityId: notification.entityId?.toString(),
            actionLabel: notification.actionLabel,
            priority: notification.priority,
            deepLink: notification.deepLink,
            dataPayload: notification.dataPayload,
            readAt: notification.readAt,
            deliveredAt: notification.deliveredAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        };
    }
};
exports.NotificationsService = NotificationsService;
NotificationsService.SECURITY_BREACH_DIGEST_WINDOW_MS = 15 * 60 * 1000;
NotificationsService.SECURITY_STALL_DIGEST_WINDOW_MS = 15 * 60 * 1000;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(1, (0, common_1.Inject)(notification_provider_port_1.NOTIFICATION_PROVIDER_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map