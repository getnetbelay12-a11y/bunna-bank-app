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
exports.NotificationProviderService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const member_schema_1 = require("../members/schemas/member.schema");
const channel_notification_provider_port_1 = require("./channel-notification-provider.port");
let NotificationProviderService = class NotificationProviderService {
    constructor(memberModel, mobilePushProvider, emailProvider, smsProvider) {
        this.memberModel = memberModel;
        this.mobilePushProvider = mobilePushProvider;
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
    }
    async dispatch(payload) {
        const category = this.resolveCategory(payload.type);
        const preferredChannel = payload.preferredChannel ?? enums_1.NotificationChannel.MOBILE_PUSH;
        const member = payload.userType === 'member'
            ? await this.memberModel
                .findById(new mongoose_2.Types.ObjectId(payload.userId))
                .lean()
            : null;
        if (preferredChannel === enums_1.NotificationChannel.MOBILE_PUSH) {
            const pushResult = await this.mobilePushProvider.send({
                channel: enums_1.NotificationChannel.MOBILE_PUSH,
                recipient: payload.userId,
                memberId: payload.userId,
                category,
                subject: payload.title,
                messageBody: payload.message,
                actionLabel: payload.actionLabel,
                deepLink: payload.deepLink,
                dataPayload: payload.dataPayload,
            });
            if (pushResult.status !== 'failed') {
                return {
                    channel: enums_1.NotificationChannel.MOBILE_PUSH,
                    status: enums_1.NotificationStatus.SENT,
                    deliveredAt: new Date(),
                    category,
                };
            }
            if (member?.email) {
                const emailResult = await this.emailProvider.send({
                    channel: enums_1.NotificationChannel.EMAIL,
                    recipient: member.email,
                    memberId: payload.userId,
                    category,
                    subject: payload.title,
                    messageBody: payload.message,
                });
                if (emailResult.status !== 'failed') {
                    return {
                        channel: enums_1.NotificationChannel.EMAIL,
                        fallbackChannel: enums_1.NotificationChannel.MOBILE_PUSH,
                        status: enums_1.NotificationStatus.SENT,
                        deliveredAt: new Date(),
                        category,
                    };
                }
            }
            if (payload.priority === 'high' && member?.phone) {
                const smsResult = await this.smsProvider.send({
                    channel: enums_1.NotificationChannel.SMS,
                    recipient: member.phone,
                    memberId: payload.userId,
                    category,
                    subject: payload.title,
                    messageBody: payload.message,
                });
                if (smsResult.status !== 'failed') {
                    return {
                        channel: enums_1.NotificationChannel.SMS,
                        fallbackChannel: enums_1.NotificationChannel.MOBILE_PUSH,
                        status: enums_1.NotificationStatus.SENT,
                        deliveredAt: new Date(),
                        category,
                    };
                }
            }
            return {
                channel: enums_1.NotificationChannel.MOBILE_PUSH,
                status: enums_1.NotificationStatus.FAILED,
                errorMessage: pushResult.errorMessage,
                category,
            };
        }
        if (preferredChannel === enums_1.NotificationChannel.EMAIL && member?.email) {
            const emailResult = await this.emailProvider.send({
                channel: enums_1.NotificationChannel.EMAIL,
                recipient: member.email,
                memberId: payload.userId,
                category,
                subject: payload.title,
                messageBody: payload.message,
            });
            return {
                channel: enums_1.NotificationChannel.EMAIL,
                status: emailResult.status === 'failed'
                    ? enums_1.NotificationStatus.FAILED
                    : enums_1.NotificationStatus.SENT,
                deliveredAt: emailResult.status === 'failed' ? undefined : new Date(),
                errorMessage: emailResult.errorMessage,
                category,
            };
        }
        return {
            channel: preferredChannel,
            status: enums_1.NotificationStatus.FAILED,
            errorMessage: 'No recipient or provider was available for the selected channel.',
            category,
        };
    }
    resolveCategory(type) {
        switch (type) {
            case enums_1.NotificationType.LOAN_DUE:
            case enums_1.NotificationType.LOAN_OVERDUE:
            case enums_1.NotificationType.LOAN_APPROVED:
            case enums_1.NotificationType.LOAN_REJECTED:
            case enums_1.NotificationType.LOAN_DOCUMENT_REQUIRED:
            case enums_1.NotificationType.LOAN_DISBURSED:
            case enums_1.NotificationType.LOAN_STATUS:
                return enums_1.NotificationCategory.LOAN;
            case enums_1.NotificationType.INSURANCE_DUE:
            case enums_1.NotificationType.INSURANCE_RENEWAL_DUE:
            case enums_1.NotificationType.INSURANCE_EXPIRING:
            case enums_1.NotificationType.INSURANCE_EXPIRED:
            case enums_1.NotificationType.LOAN_LINKED_INSURANCE_REMINDER:
            case enums_1.NotificationType.INSURANCE:
                return enums_1.NotificationCategory.INSURANCE;
            case enums_1.NotificationType.PAYMENT_SUCCESS:
            case enums_1.NotificationType.PAYMENT_FAILED:
            case enums_1.NotificationType.SCHOOL_PAYMENT_DUE:
            case enums_1.NotificationType.PAYMENT:
                return enums_1.NotificationCategory.PAYMENT;
            case enums_1.NotificationType.AUTOPAY_SUCCESS:
            case enums_1.NotificationType.AUTOPAY_FAILED:
                return enums_1.NotificationCategory.AUTOPAY;
            case enums_1.NotificationType.SUPPORT_ASSIGNED:
            case enums_1.NotificationType.SUPPORT_REPLY:
            case enums_1.NotificationType.SUPPORT_RESOLVED:
            case enums_1.NotificationType.CHAT:
            case enums_1.NotificationType.SERVICE_REQUEST:
                return enums_1.NotificationCategory.SUPPORT;
            case enums_1.NotificationType.LOGIN_DETECTED:
            case enums_1.NotificationType.SUSPICIOUS_LOGIN:
            case enums_1.NotificationType.ACCOUNT_LOCKED:
            case enums_1.NotificationType.ACCOUNT_UNLOCKED:
            case enums_1.NotificationType.PHONE_NUMBER_CHANGE_REQUESTED:
            case enums_1.NotificationType.PHONE_NUMBER_CHANGE_COMPLETED:
                return enums_1.NotificationCategory.SECURITY;
            case enums_1.NotificationType.KYC_SUBMITTED:
            case enums_1.NotificationType.KYC_VERIFIED:
            case enums_1.NotificationType.KYC_REJECTED:
            case enums_1.NotificationType.KYC_NEED_MORE_INFORMATION:
                return enums_1.NotificationCategory.KYC;
            case enums_1.NotificationType.SHAREHOLDER_ANNOUNCEMENT:
            case enums_1.NotificationType.VOTE_OPEN:
            case enums_1.NotificationType.VOTE_CLOSING_SOON:
            case enums_1.NotificationType.VOTE_RESULT_PUBLISHED:
            case enums_1.NotificationType.SHAREHOLDER_VOTE:
            case enums_1.NotificationType.VOTING:
                return enums_1.NotificationCategory.SHAREHOLDER;
            case enums_1.NotificationType.ANNOUNCEMENT:
            case enums_1.NotificationType.CAMPAIGN:
            case enums_1.NotificationType.SYSTEM:
            default:
                return enums_1.NotificationCategory.SYSTEM;
        }
    }
};
exports.NotificationProviderService = NotificationProviderService;
exports.NotificationProviderService = NotificationProviderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(1, (0, common_1.Inject)(channel_notification_provider_port_1.MOBILE_PUSH_NOTIFICATION_PROVIDER)),
    __param(2, (0, common_1.Inject)(channel_notification_provider_port_1.EMAIL_NOTIFICATION_PROVIDER)),
    __param(3, (0, common_1.Inject)(channel_notification_provider_port_1.SMS_NOTIFICATION_PROVIDER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, Object, Object])
], NotificationProviderService);
//# sourceMappingURL=notification-provider.service.js.map