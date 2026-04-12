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
var NotificationCampaignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCampaignService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const member_schema_1 = require("../members/schemas/member.schema");
const autopay_setting_schema_1 = require("../service-placeholders/schemas/autopay-setting.schema");
const notification_delivery_service_1 = require("./notification-delivery.service");
const notification_template_service_1 = require("./notification-template.service");
const template_renderer_service_1 = require("./template-renderer.service");
const notification_campaign_schema_1 = require("./schemas/notification-campaign.schema");
const notification_log_schema_1 = require("./schemas/notification-log.schema");
const notifications_service_1 = require("./notifications.service");
let NotificationCampaignService = NotificationCampaignService_1 = class NotificationCampaignService {
    constructor(notificationCampaignModel, notificationLogModel, memberModel, autopaySettingModel, configService, notificationTemplateService, notificationDeliveryService, templateRendererService, notificationsService) {
        this.notificationCampaignModel = notificationCampaignModel;
        this.notificationLogModel = notificationLogModel;
        this.memberModel = memberModel;
        this.autopaySettingModel = autopaySettingModel;
        this.configService = configService;
        this.notificationTemplateService = notificationTemplateService;
        this.notificationDeliveryService = notificationDeliveryService;
        this.templateRendererService = templateRendererService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationCampaignService_1.name);
        this.testEmailRecipient =
            this.configService.get('notifications.email.testRecipient') ??
                process.env.TEST_EMAIL_RECIPIENT ??
                process.env.DEMO_NOTIFICATION_EMAIL ??
                'write2get@gmail.com';
        this.forceTestEmailRecipient =
            this.configService.get('notifications.email.forceTestRecipient') ??
                process.env.EMAIL_FORCE_TEST_RECIPIENT ??
                '';
        this.forceTestTelegramChatId =
            this.configService.get('notifications.telegram.forceTestChatId') ??
                process.env.TELEGRAM_FORCE_TEST_CHAT_ID ??
                '';
        this.forceTestPushCustomerId =
            process.env.PUSH_FORCE_TEST_CUSTOMER_ID?.trim() || 'BUN-100001';
        this.demoMode = this.configService.get('app.demoMode') === true;
        this.nodeEnv =
            this.configService.get('app.nodeEnv') ??
                process.env.NODE_ENV ??
                'development';
    }
    async listCampaigns(currentUser) {
        this.ensureManagerAccess(currentUser);
        return this.notificationCampaignModel
            .find(this.buildCampaignScope(currentUser))
            .sort({ createdAt: -1 })
            .lean();
    }
    async createCampaign(currentUser, dto) {
        this.ensureManagerAccess(currentUser);
        const channels = this.normalizeChannels(dto.channels);
        const template = await this.notificationTemplateService.getTemplateByType(dto.templateType);
        const targets = await this.resolveTargets(currentUser, dto);
        return this.notificationCampaignModel.create({
            category: dto.category,
            templateType: dto.templateType,
            channels,
            targetType: dto.targetType,
            targetIds: targets.map((member) => member._id),
            filters: {
                ...(dto.filters ?? {}),
                ...this.buildCampaignFilters(dto),
            },
            messageSubject: this.resolveCampaignText(dto.messageSubject, template.subject),
            messageBody: this.resolveCampaignText(dto.messageBody, template.messageBody),
            status: dto.scheduledAt
                ? enums_1.NotificationCampaignStatus.SCHEDULED
                : enums_1.NotificationCampaignStatus.DRAFT,
            createdBy: new mongoose_2.Types.ObjectId(currentUser.sub),
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        });
    }
    async getCampaign(currentUser, campaignId) {
        this.ensureManagerAccess(currentUser);
        const campaign = await this.notificationCampaignModel.findOne({
            _id: this.toObjectId(campaignId, 'campaignId'),
            ...this.buildCampaignScope(currentUser),
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Notification campaign not found.');
        }
        return campaign;
    }
    async sendCampaign(currentUser, campaignId) {
        const campaign = await this.getCampaign(currentUser, campaignId);
        const members = await this.memberModel.find({ _id: { $in: campaign.targetIds } });
        this.logger.log(`sendCampaign request received campaign=${campaign._id.toString()} template=${campaign.templateType} channels=${campaign.channels.join(',')} targets=${members.length}`);
        campaign.status = enums_1.NotificationCampaignStatus.SENDING;
        await campaign.save();
        const logs = [];
        const channelSummary = this.createChannelSummary(campaign.channels);
        const recipientResults = new Map();
        const demoRecipientEmail = typeof campaign.filters?.demoRecipientEmail === 'string'
            ? campaign.filters.demoRecipientEmail
            : undefined;
        const forcedTestRecipient = this.resolveForcedEmailRecipient(demoRecipientEmail);
        if (forcedTestRecipient) {
            this.logger.log(`campaign=${campaign._id.toString()} forcedRecipient=${forcedTestRecipient}`);
        }
        if (this.resolveForcedTelegramChatId()) {
            this.logger.log(`campaign=${campaign._id.toString()} telegramForceTestChatId=active`);
        }
        let forcedEmailAlreadySent = false;
        for (const member of members) {
            for (const channel of campaign.channels) {
                if (channel === enums_1.NotificationChannel.EMAIL &&
                    forcedTestRecipient &&
                    forcedEmailAlreadySent) {
                    channelSummary[channel].skipped += 1;
                    this.recordRecipientResult(recipientResults, member, channel, {
                        status: 'skipped',
                        recipient: forcedTestRecipient,
                        errorMessage: 'Forced local demo email recipient already received this campaign.',
                    });
                    logs.push({
                        campaignId: campaign._id,
                        memberId: member._id,
                        category: campaign.category,
                        channel,
                        recipient: forcedTestRecipient,
                        status: enums_1.NotificationLogStatus.SENT,
                        messageSubject: campaign.messageSubject,
                        messageBody: campaign.messageBody,
                        errorMessage: 'Skipped duplicate forced local demo email delivery.',
                    });
                    continue;
                }
                const recipient = this.resolveRecipient(member, channel, campaign.category, forcedTestRecipient);
                this.logger.log(`campaign=${campaign._id.toString()} member=${member._id.toString()} template=${campaign.templateType} channel=${channel} resolvedRecipient=${recipient ?? 'unavailable'}`);
                if (!recipient) {
                    channelSummary[channel].skipped += 1;
                    this.recordRecipientResult(recipientResults, member, channel, {
                        status: 'skipped',
                        errorMessage: channel === enums_1.NotificationChannel.TELEGRAM
                            ? 'Telegram customer is not linked or has unsubscribed.'
                            : `Recipient unavailable for channel ${channel}.`,
                    });
                    logs.push({
                        campaignId: campaign._id,
                        memberId: member._id,
                        category: campaign.category,
                        channel,
                        recipient: 'unavailable',
                        status: enums_1.NotificationLogStatus.FAILED,
                        messageSubject: campaign.messageSubject,
                        messageBody: campaign.messageBody,
                        errorMessage: `Recipient unavailable for channel ${channel}.`,
                    });
                    continue;
                }
                try {
                    const rendered = this.renderCampaignContent(campaign, member);
                    const storeSpecificMobileRecord = this.shouldStoreSpecificMobileRecord(campaign.templateType, channel);
                    const pushMetadata = await this.resolvePushMetadata(campaign, member);
                    const result = await this.notificationDeliveryService.deliver({
                        channel,
                        recipient,
                        memberId: member._id.toString(),
                        category: campaign.category,
                        subject: rendered.subject,
                        messageBody: this.resolveChannelBody(channel, rendered),
                        htmlBody: channel === enums_1.NotificationChannel.EMAIL ? rendered.emailHtml : undefined,
                        attachments: channel === enums_1.NotificationChannel.EMAIL ? rendered.emailAttachments : undefined,
                        actionLabel: pushMetadata.actionLabel,
                        deepLink: pushMetadata.deepLink,
                        dataPayload: pushMetadata.dataPayload,
                        userRole: member.role,
                        createInAppRecord: !storeSpecificMobileRecord,
                    });
                    if (storeSpecificMobileRecord) {
                        await this.storeSpecificMobileNotification({
                            campaign,
                            member,
                            result,
                        });
                    }
                    logs.push({
                        campaignId: campaign._id,
                        memberId: member._id,
                        category: campaign.category,
                        channel,
                        recipient,
                        status: this.notificationDeliveryService.toLogStatus(result),
                        providerMessageId: result.providerMessageId,
                        messageSubject: rendered.subject,
                        messageBody: this.resolveChannelBody(channel, rendered),
                        errorMessage: result.errorMessage,
                        sentAt: new Date(),
                        deliveredAt: result.status === 'delivered' ? new Date() : undefined,
                    });
                    this.incrementChannelSummary(channelSummary, result.status, channel);
                    this.recordRecipientResult(recipientResults, member, channel, {
                        status: result.status,
                        recipient,
                        providerMessageId: result.providerMessageId,
                        errorMessage: result.errorMessage,
                    });
                    if (channel === enums_1.NotificationChannel.EMAIL && forcedTestRecipient) {
                        forcedEmailAlreadySent = true;
                    }
                    this.logger.log(`campaign=${campaign._id.toString()} template=${campaign.templateType} channel=${channel} recipient=${recipient} status=${result.status}`);
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown campaign delivery error.';
                    this.logger.error(`campaign=${campaign._id.toString()} template=${campaign.templateType} channel=${channel} recipient=${recipient} failed: ${message}`, error instanceof Error ? error.stack : undefined);
                    logs.push({
                        campaignId: campaign._id,
                        memberId: member._id,
                        category: campaign.category,
                        channel,
                        recipient,
                        status: enums_1.NotificationLogStatus.FAILED,
                        messageSubject: campaign.messageSubject,
                        messageBody: campaign.messageBody,
                        errorMessage: message,
                        sentAt: new Date(),
                    });
                    channelSummary[channel].failed += 1;
                    this.recordRecipientResult(recipientResults, member, channel, {
                        status: 'failed',
                        recipient,
                        errorMessage: message,
                    });
                }
            }
        }
        if (logs.length > 0) {
            await this.notificationLogModel.insertMany(logs);
        }
        campaign.status = logs.some((log) => log.status === enums_1.NotificationLogStatus.FAILED)
            ? enums_1.NotificationCampaignStatus.FAILED
            : enums_1.NotificationCampaignStatus.COMPLETED;
        campaign.sentAt = new Date();
        await campaign.save();
        this.logger.log(`campaign=${campaign._id.toString()} completed status=${campaign.status} logs=${logs.length}`);
        if (logs.length > 0 && logs.every((log) => log.status === enums_1.NotificationLogStatus.FAILED)) {
            throw new common_1.ServiceUnavailableException(logs.find((log) => log.errorMessage)?.errorMessage ??
                'Notification delivery failed for all selected channels.');
        }
        const campaignPayload = typeof campaign.toObject === 'function'
            ? campaign.toObject()
            : campaign;
        return Object.assign(campaignPayload, {
            deliverySummary: {
                totalTargets: members.length,
                totalChannels: campaign.channels.length,
                totalAttempts: members.length * campaign.channels.length,
                channels: channelSummary,
                perRecipientResults: Array.from(recipientResults.values()),
            },
        });
    }
    resolveCampaignText(preferredValue, fallbackValue) {
        const normalizedPreferred = preferredValue?.trim();
        if (normalizedPreferred) {
            return normalizedPreferred;
        }
        const normalizedFallback = fallbackValue?.trim();
        if (normalizedFallback) {
            return normalizedFallback;
        }
        return '';
    }
    async listLogs(currentUser, campaignId) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildMemberScope(currentUser);
        const memberIds = Object.keys(scope).length > 0
            ? (await this.memberModel
                .find(scope)
                .select('_id')
                .lean()).map((item) => item._id)
            : undefined;
        return this.notificationLogModel
            .find({
            ...(campaignId ? { campaignId: this.toObjectId(campaignId, 'campaignId') } : {}),
            ...(memberIds ? { memberId: { $in: memberIds } } : {}),
        })
            .sort({ createdAt: -1 })
            .lean();
    }
    async resolveTargets(currentUser, dto) {
        const scope = this.buildMemberScope(currentUser);
        const filter = { ...scope };
        if (dto.targetIds?.length) {
            const resolvedTargetFilters = this.buildTargetIdentifierFilter(dto.targetIds);
            if (resolvedTargetFilters.length === 1) {
                Object.assign(filter, resolvedTargetFilters[0]);
            }
            else {
                filter.$or = [...(Array.isArray(filter.$or) ? filter.$or : []), ...resolvedTargetFilters];
            }
        }
        if (dto.targetType === 'filtered_customers' && dto.filters) {
            if (typeof dto.filters.branchId === 'string') {
                filter.branchId = this.toObjectId(dto.filters.branchId, 'filters.branchId');
            }
            if (typeof dto.filters.districtId === 'string') {
                filter.districtId = this.toObjectId(dto.filters.districtId, 'filters.districtId');
            }
            if (typeof dto.filters.memberType === 'string') {
                filter.memberType = dto.filters.memberType;
            }
        }
        const members = await this.memberModel.find(filter);
        const membersWithLocalPushTarget = await this.appendForcedDemoPushTarget(members, dto.channels);
        if (membersWithLocalPushTarget.length === 0) {
            throw new common_1.NotFoundException('No target customers matched this campaign.');
        }
        return membersWithLocalPushTarget;
    }
    resolveRecipient(member, channel, category, demoRecipientEmail) {
        switch (channel) {
            case enums_1.NotificationChannel.MOBILE_PUSH:
                return member._id.toString();
            case enums_1.NotificationChannel.EMAIL:
                return demoRecipientEmail || member.email || this.testEmailRecipient;
            case enums_1.NotificationChannel.SMS:
                return member.phone;
            case enums_1.NotificationChannel.TELEGRAM:
                if (this.resolveForcedTelegramChatId()) {
                    return this.resolveForcedTelegramChatId();
                }
                return this.canReceiveTelegram(member, category)
                    ? member.telegramChatId || member.telegramUserId
                    : undefined;
            case enums_1.NotificationChannel.IN_APP:
                return member.phone;
        }
    }
    renderCampaignContent(campaign, member) {
        return this.templateRendererService.render({
            templateType: campaign.templateType,
            subject: campaign.messageSubject,
            customMessageBody: campaign.messageBody,
            member,
        });
    }
    buildCampaignFilters(dto) {
        const emailRecipient = this.resolveForcedEmailRecipient(dto.demoRecipientEmail);
        return emailRecipient ? { demoRecipientEmail: emailRecipient } : {};
    }
    async appendForcedDemoPushTarget(members, channels) {
        if (!this.isLocalDemoDeliveryMode()) {
            return members;
        }
        if (!this.normalizeChannels(channels).some((channel) => [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.IN_APP].includes(channel))) {
            return members;
        }
        if (!this.forceTestPushCustomerId ||
            members.some((member) => member.customerId === this.forceTestPushCustomerId ||
                member.memberNumber === this.forceTestPushCustomerId)) {
            return members;
        }
        const forcedMember = await this.memberModel.findOne({
            $or: [
                { customerId: this.forceTestPushCustomerId },
                { memberNumber: this.forceTestPushCustomerId },
            ],
        });
        if (!forcedMember) {
            return members;
        }
        return [...members, forcedMember];
    }
    normalizeChannels(channels) {
        const normalized = [
            enums_1.NotificationChannel.MOBILE_PUSH,
            ...channels.filter((item) => item !== enums_1.NotificationChannel.MOBILE_PUSH),
        ];
        return Array.from(new Set(normalized));
    }
    shouldStoreSpecificMobileRecord(templateType, channel) {
        return (templateType === enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE &&
            [enums_1.NotificationChannel.MOBILE_PUSH, enums_1.NotificationChannel.IN_APP].includes(channel));
    }
    async storeSpecificMobileNotification(input) {
        if (input.campaign.templateType !== enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE) {
            return;
        }
        const autoPayEnabled = await this.hasEnabledSchoolAutopay(input.member._id);
        const title = autoPayEnabled ? 'School fee reminder' : 'School fee due';
        const message = autoPayEnabled
            ? 'Your school payment is already scheduled with AutoPay. Review the schedule in School Pay if any change is needed.'
            : this.resolveCampaignText(input.campaign.messageBody, 'Your school fee is due soon. Open School Pay to review the student profile and complete payment.');
        await this.notificationsService.storeNotificationRecord({
            userType: 'member',
            userId: input.member._id.toString(),
            userRole: input.member.role,
            type: enums_1.NotificationType.SCHOOL_PAYMENT_DUE,
            channel: enums_1.NotificationChannel.MOBILE_PUSH,
            status: input.result.status === 'failed'
                ? enums_1.NotificationStatus.FAILED
                : enums_1.NotificationStatus.SENT,
            title,
            message,
            entityType: 'school_payment',
            actionLabel: autoPayEnabled ? 'Review school pay' : 'Pay now',
            priority: 'high',
            deepLink: '/payments/school',
            dataPayload: {
                serviceType: 'school_payment',
                autoPayEnabled,
            },
            deliveredAt: input.result.status === 'failed' ? undefined : new Date(),
        });
    }
    async hasEnabledSchoolAutopay(memberId) {
        const match = await this.autopaySettingModel.exists({
            memberId,
            serviceType: 'school_payment',
            enabled: true,
        });
        return Boolean(match);
    }
    async resolvePushMetadata(campaign, member) {
        if (campaign.templateType === enums_1.NotificationTemplateType.SCHOOL_PAYMENT_DUE) {
            const autoPayEnabled = await this.hasEnabledSchoolAutopay(member._id);
            return {
                actionLabel: autoPayEnabled ? 'Review school pay' : 'Pay now',
                deepLink: '/payments/school',
                dataPayload: {
                    serviceType: 'school_payment',
                    autoPayEnabled,
                },
            };
        }
        return {
            actionLabel: undefined,
            deepLink: undefined,
            dataPayload: undefined,
        };
    }
    resolveChannelBody(channel, rendered) {
        switch (channel) {
            case enums_1.NotificationChannel.MOBILE_PUSH:
                return rendered.inAppMessage;
            case enums_1.NotificationChannel.EMAIL:
                return rendered.emailText;
            case enums_1.NotificationChannel.SMS:
                return rendered.smsMessage;
            case enums_1.NotificationChannel.TELEGRAM:
                return rendered.telegramMessage;
            case enums_1.NotificationChannel.IN_APP:
                return rendered.inAppMessage;
        }
    }
    buildCampaignScope(currentUser) {
        return { createdBy: this.toObjectId(currentUser.sub, 'currentUser.sub') };
    }
    buildMemberScope(currentUser) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            return { branchId: this.toObjectId(currentUser.branchId, 'currentUser.branchId') };
        }
        if ([enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
            currentUser.districtId) {
            return {
                districtId: this.toObjectId(currentUser.districtId, 'currentUser.districtId'),
            };
        }
        return {};
    }
    toObjectId(value, fieldName) {
        if (!mongoose_2.Types.ObjectId.isValid(value)) {
            throw new common_1.BadRequestException(`${fieldName} must be a valid ObjectId.`);
        }
        return new mongoose_2.Types.ObjectId(value);
    }
    ensureManagerAccess(currentUser) {
        if (![
            enums_1.UserRole.BRANCH_MANAGER,
            enums_1.UserRole.DISTRICT_MANAGER,
            enums_1.UserRole.DISTRICT_OFFICER,
            enums_1.UserRole.HEAD_OFFICE_MANAGER,
            enums_1.UserRole.HEAD_OFFICE_OFFICER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only managers can manage notification campaigns.');
        }
    }
    resolveForcedEmailRecipient(demoRecipientEmail) {
        if (!this.isLocalDemoDeliveryMode()) {
            return undefined;
        }
        return demoRecipientEmail || this.forceTestEmailRecipient || this.testEmailRecipient;
    }
    isLocalDemoDeliveryMode() {
        return this.demoMode || this.nodeEnv === 'development';
    }
    resolveForcedTelegramChatId() {
        if (!this.isLocalDemoDeliveryMode()) {
            return undefined;
        }
        return this.forceTestTelegramChatId || undefined;
    }
    canReceiveTelegram(member, category) {
        if (!member.telegramSubscribed || !member.telegramChatId) {
            return false;
        }
        if (category === enums_1.NotificationCategory.LOAN &&
            member.optInLoanReminders === false) {
            return false;
        }
        if (category === enums_1.NotificationCategory.INSURANCE &&
            member.optInInsuranceReminders === false) {
            return false;
        }
        return true;
    }
    createChannelSummary(channels) {
        return Object.fromEntries(channels.map((channel) => [
            channel,
            {
                sent: 0,
                delivered: 0,
                failed: 0,
                skipped: 0,
            },
        ]));
    }
    incrementChannelSummary(summary, status, channel) {
        summary[channel][status] += 1;
    }
    recordRecipientResult(recipientResults, member, channel, result) {
        const memberId = member._id.toString();
        const existing = recipientResults.get(memberId) ??
            {
                customerId: member.customerId,
                memberId,
                channels: {},
            };
        existing.channels[channel] = result;
        recipientResults.set(memberId, existing);
    }
    buildTargetIdentifierFilter(targetIds) {
        return targetIds.flatMap((value) => {
            const trimmed = value.trim();
            if (!trimmed) {
                return [];
            }
            const variants = new Set([
                trimmed,
                trimmed.toUpperCase(),
            ]);
            const filters = [
                { customerId: { $in: Array.from(variants) } },
                { memberNumber: { $in: Array.from(variants) } },
                { phone: trimmed },
            ];
            if (mongoose_2.Types.ObjectId.isValid(trimmed)) {
                filters.unshift({ _id: new mongoose_2.Types.ObjectId(trimmed) });
            }
            return filters;
        });
    }
};
exports.NotificationCampaignService = NotificationCampaignService;
exports.NotificationCampaignService = NotificationCampaignService = NotificationCampaignService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_campaign_schema_1.NotificationCampaign.name)),
    __param(1, (0, mongoose_1.InjectModel)(notification_log_schema_1.NotificationLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(3, (0, mongoose_1.InjectModel)(autopay_setting_schema_1.AutopaySetting.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        config_1.ConfigService,
        notification_template_service_1.NotificationTemplateService,
        notification_delivery_service_1.NotificationDeliveryService,
        template_renderer_service_1.TemplateRendererService,
        notifications_service_1.NotificationsService])
], NotificationCampaignService);
//# sourceMappingURL=notification-campaign.service.js.map