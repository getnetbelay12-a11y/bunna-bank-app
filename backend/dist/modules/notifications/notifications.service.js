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
        let delivered = false;
        try {
            delivered = await this.notificationProvider.dispatch({
                userType: dto.userType,
                userId: dto.userId,
                type: dto.type,
                title: dto.title,
                message: dto.message,
            });
        }
        catch (error) {
            this.logger.warn(`Notification dispatch failed for ${dto.userType}:${dto.userId}.`, error instanceof Error ? error.stack : undefined);
        }
        const notification = await this.notificationModel.create({
            userType: dto.userType,
            userId: new mongoose_2.Types.ObjectId(dto.userId),
            userRole: dto.userRole,
            type: dto.type,
            status: dto.status ??
                (delivered ? enums_1.NotificationStatus.SENT : enums_1.NotificationStatus.FAILED),
            title: dto.title,
            message: dto.message,
            entityType: dto.entityType,
            entityId: dto.entityId ? new mongoose_2.Types.ObjectId(dto.entityId) : undefined,
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
            status: notification.status,
            title: notification.title,
            message: notification.message,
            entityType: notification.entityType,
            entityId: notification.entityId?.toString(),
            readAt: notification.readAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(1, (0, common_1.Inject)(notification_provider_port_1.NOTIFICATION_PROVIDER_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map