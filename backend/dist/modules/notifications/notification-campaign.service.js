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
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const member_schema_1 = require("../members/schemas/member.schema");
const notification_delivery_service_1 = require("./notification-delivery.service");
const notification_template_service_1 = require("./notification-template.service");
const template_renderer_service_1 = require("./template-renderer.service");
const notification_campaign_schema_1 = require("./schemas/notification-campaign.schema");
const notification_log_schema_1 = require("./schemas/notification-log.schema");
let NotificationCampaignService = NotificationCampaignService_1 = class NotificationCampaignService {
    constructor(notificationCampaignModel, notificationLogModel, memberModel, notificationTemplateService, notificationDeliveryService, templateRendererService) {
        this.notificationCampaignModel = notificationCampaignModel;
        this.notificationLogModel = notificationLogModel;
        this.memberModel = memberModel;
        this.notificationTemplateService = notificationTemplateService;
        this.notificationDeliveryService = notificationDeliveryService;
        this.templateRendererService = templateRendererService;
        this.logger = new common_1.Logger(NotificationCampaignService_1.name);
        this.demoFallbackEmail = process.env.TEST_EMAIL_RECIPIENT ||
            process.env.DEMO_NOTIFICATION_EMAIL ||
            'write2get@gmail.com';
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
        const template = await this.notificationTemplateService.getTemplateByType(dto.templateType);
        const forcedDemoRecipientEmail = dto.channels.includes(enums_1.NotificationChannel.EMAIL)
            ? dto.demoRecipientEmail || this.demoFallbackEmail
            : undefined;
        const targets = await this.resolveTargets(currentUser, dto, forcedDemoRecipientEmail);
        return this.notificationCampaignModel.create({
            category: dto.category,
            templateType: dto.templateType,
            channels: dto.channels,
            targetType: dto.targetType,
            targetIds: targets.map((member) => member._id),
            filters: {
                ...(dto.filters ?? {}),
                ...(forcedDemoRecipientEmail
                    ? {
                        demoRecipientEmail: forcedDemoRecipientEmail,
                    }
                    : {}),
            },
            messageSubject: dto.messageSubject ?? template.subject,
            messageBody: dto.messageBody ?? template.messageBody,
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
            _id: new mongoose_2.Types.ObjectId(campaignId),
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
        campaign.status = enums_1.NotificationCampaignStatus.SENDING;
        await campaign.save();
        const logs = [];
        const demoRecipientEmail = typeof campaign.filters?.demoRecipientEmail === 'string'
            ? campaign.filters.demoRecipientEmail
            : undefined;
        for (const member of members) {
            for (const channel of campaign.channels) {
                const recipient = this.resolveRecipient(member, channel, demoRecipientEmail);
                const rendered = this.renderCampaignContent(campaign, member);
                if (!recipient) {
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
                const result = await this.notificationDeliveryService.deliver({
                    channel,
                    recipient,
                    memberId: member._id.toString(),
                    category: campaign.category,
                    subject: rendered.subject,
                    messageBody: this.resolveChannelBody(channel, rendered),
                    htmlBody: channel === enums_1.NotificationChannel.EMAIL ? rendered.emailHtml : undefined,
                    userRole: member.role,
                });
                this.logger.log(`Reminder delivery ${result.status} channel=${channel} recipient=${recipient} template=${campaign.templateType}`);
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
        return campaign;
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
            ...(campaignId ? { campaignId: new mongoose_2.Types.ObjectId(campaignId) } : {}),
            ...(memberIds ? { memberId: { $in: memberIds } } : {}),
        })
            .sort({ createdAt: -1 })
            .lean();
    }
    async resolveTargets(currentUser, dto, forcedDemoRecipientEmail) {
        const scope = this.buildMemberScope(currentUser);
        const filter = { ...scope };
        if (dto.targetIds?.length) {
            filter._id = { $in: dto.targetIds.map((id) => new mongoose_2.Types.ObjectId(id)) };
        }
        if (dto.targetType === 'filtered_customers' && dto.filters) {
            if (typeof dto.filters.branchId === 'string') {
                filter.branchId = new mongoose_2.Types.ObjectId(dto.filters.branchId);
            }
            if (typeof dto.filters.districtId === 'string') {
                filter.districtId = new mongoose_2.Types.ObjectId(dto.filters.districtId);
            }
            if (typeof dto.filters.memberType === 'string') {
                filter.memberType = dto.filters.memberType;
            }
        }
        const members = await this.memberModel.find(filter);
        if (members.length === 0) {
            throw new common_1.NotFoundException('No target customers matched this campaign.');
        }
        return forcedDemoRecipientEmail ? members.slice(0, 1) : members;
    }
    resolveRecipient(member, channel, demoRecipientEmail) {
        switch (channel) {
            case enums_1.NotificationChannel.EMAIL:
                return demoRecipientEmail || member.email || this.demoFallbackEmail;
            case enums_1.NotificationChannel.SMS:
            case enums_1.NotificationChannel.TELEGRAM:
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
            useDemoContent: typeof campaign.filters?.demoRecipientEmail === 'string',
        });
    }
    resolveChannelBody(channel, rendered) {
        switch (channel) {
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
        return { createdBy: new mongoose_2.Types.ObjectId(currentUser.sub) };
    }
    buildMemberScope(currentUser) {
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            return { branchId: new mongoose_2.Types.ObjectId(currentUser.branchId) };
        }
        if ([enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
            currentUser.districtId) {
            return { districtId: new mongoose_2.Types.ObjectId(currentUser.districtId) };
        }
        return {};
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
};
exports.NotificationCampaignService = NotificationCampaignService;
exports.NotificationCampaignService = NotificationCampaignService = NotificationCampaignService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_campaign_schema_1.NotificationCampaign.name)),
    __param(1, (0, mongoose_1.InjectModel)(notification_log_schema_1.NotificationLog.name)),
    __param(2, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        notification_template_service_1.NotificationTemplateService,
        notification_delivery_service_1.NotificationDeliveryService,
        template_renderer_service_1.TemplateRendererService])
], NotificationCampaignService);
//# sourceMappingURL=notification-campaign.service.js.map