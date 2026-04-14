import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  NotificationCampaignStatus,
  NotificationCategory,
  NotificationChannel,
  NotificationLogStatus,
  NotificationStatus,
  NotificationTemplateType,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import {
  AutopaySetting,
  AutopaySettingDocument,
} from '../service-placeholders/schemas/autopay-setting.schema';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { CreateNotificationCampaignDto } from './dto';
import {
  NotificationCampaign,
  NotificationCampaignDocument,
} from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogDocument } from './schemas/notification-log.schema';
import { NotificationsService } from './notifications.service';

type CampaignSendChannelSummary = {
  sent: number;
  delivered: number;
  failed: number;
  skipped: number;
};

type CampaignSendResult = NotificationCampaignDocument & {
  deliverySummary: {
    totalTargets: number;
    totalChannels: number;
    totalAttempts: number;
    channels: Record<string, CampaignSendChannelSummary>;
    perRecipientResults: Array<{
      customerId: string;
      memberId: string;
      channels: Record<
        string,
        {
          status: 'sent' | 'delivered' | 'failed' | 'skipped';
          recipient?: string;
          providerMessageId?: string;
          errorMessage?: string;
        }
      >;
    }>;
  };
};

@Injectable()
export class NotificationCampaignService {
  private readonly logger = new Logger(NotificationCampaignService.name);
  private readonly testEmailRecipient: string;
  private readonly forceTestEmailRecipient: string;
  private readonly forceTestTelegramChatId: string;
  private readonly forceTestPushCustomerId: string;
  private readonly demoMode: boolean;
  private readonly nodeEnv: string;

  constructor(
    @InjectModel(NotificationCampaign.name)
    private readonly notificationCampaignModel: Model<NotificationCampaignDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(AutopaySetting.name)
    private readonly autopaySettingModel: Model<AutopaySettingDocument>,
    private readonly configService: ConfigService,
    private readonly notificationTemplateService: NotificationTemplateService,
    private readonly notificationDeliveryService: NotificationDeliveryService,
    private readonly templateRendererService: TemplateRendererService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.testEmailRecipient =
      this.configService.get<string>('notifications.email.testRecipient') ??
      process.env.TEST_EMAIL_RECIPIENT ??
      process.env.DEMO_NOTIFICATION_EMAIL ??
      'write2get@gmail.com';
    this.forceTestEmailRecipient =
      this.configService.get<string>('notifications.email.forceTestRecipient') ??
      process.env.EMAIL_FORCE_TEST_RECIPIENT ??
      '';
    this.forceTestTelegramChatId =
      this.configService.get<string>('notifications.telegram.forceTestChatId') ??
      process.env.TELEGRAM_FORCE_TEST_CHAT_ID ??
      '';
    this.forceTestPushCustomerId =
      process.env.PUSH_FORCE_TEST_CUSTOMER_ID?.trim() || 'BUN-100001';
    this.demoMode = this.configService.get<boolean>('app.demoMode') === true;
    this.nodeEnv =
      this.configService.get<string>('app.nodeEnv') ??
      process.env.NODE_ENV ??
      'development';
  }

  async listCampaigns(currentUser: AuthenticatedUser) {
    this.ensureManagerAccess(currentUser);

    return this.notificationCampaignModel
      .find(this.buildCampaignScope(currentUser))
      .sort({ createdAt: -1 })
      .lean<NotificationCampaignDocument[]>();
  }

  async createCampaign(
    currentUser: AuthenticatedUser,
    dto: CreateNotificationCampaignDto,
  ) {
    this.ensureManagerAccess(currentUser);
    const channels = this.normalizeChannels(dto.channels);

    const template = await this.notificationTemplateService.getTemplateByType(
      dto.templateType,
    );
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
        ? NotificationCampaignStatus.SCHEDULED
        : NotificationCampaignStatus.DRAFT,
      createdBy: new Types.ObjectId(currentUser.sub),
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  async getCampaign(currentUser: AuthenticatedUser, campaignId: string) {
    this.ensureManagerAccess(currentUser);
    const campaign = await this.notificationCampaignModel.findOne({
      _id: this.toObjectId(campaignId, 'campaignId'),
      ...this.buildCampaignScope(currentUser),
    });

    if (!campaign) {
      throw new NotFoundException('Notification campaign not found.');
    }

    return campaign;
  }

  async sendCampaign(currentUser: AuthenticatedUser, campaignId: string) {
    const campaign = await this.getCampaign(currentUser, campaignId);
    const members = await this.memberModel.find({ _id: { $in: campaign.targetIds } });

    this.logger.log(
      `sendCampaign request received campaign=${campaign._id.toString()} template=${campaign.templateType} channels=${campaign.channels.join(',')} targets=${members.length}`,
    );

    campaign.status = NotificationCampaignStatus.SENDING;
    await campaign.save();

    const logs = [];
    const channelSummary = this.createChannelSummary(campaign.channels);
    const recipientResults = new Map<
      string,
      {
        customerId: string;
        memberId: string;
        channels: Record<
          string,
          {
            status: 'sent' | 'delivered' | 'failed' | 'skipped';
            recipient?: string;
            providerMessageId?: string;
            errorMessage?: string;
          }
        >;
      }
    >();
    const demoRecipientEmail =
      typeof campaign.filters?.demoRecipientEmail === 'string'
        ? campaign.filters.demoRecipientEmail
        : undefined;
    const forcedTestRecipient = this.resolveForcedEmailRecipient(demoRecipientEmail);
    if (forcedTestRecipient) {
      this.logger.log(
        `campaign=${campaign._id.toString()} forcedRecipient=${forcedTestRecipient}`,
      );
    }
    if (this.resolveForcedTelegramChatId()) {
      this.logger.log(
        `campaign=${campaign._id.toString()} telegramForceTestChatId=active`,
      );
    }
    let forcedEmailAlreadySent = false;

    for (const member of members) {
      for (const channel of campaign.channels) {
        if (
          channel === NotificationChannel.EMAIL &&
          forcedTestRecipient &&
          forcedEmailAlreadySent
        ) {
          channelSummary[channel].skipped += 1;
          this.recordRecipientResult(recipientResults, member, channel, {
            status: 'skipped',
            recipient: forcedTestRecipient,
            errorMessage:
              'Forced local demo email recipient already received this campaign.',
          });
          logs.push({
            campaignId: campaign._id,
            memberId: member._id,
            category: campaign.category,
            channel,
            recipient: forcedTestRecipient,
            status: NotificationLogStatus.SENT,
            messageSubject: campaign.messageSubject,
            messageBody: campaign.messageBody,
            errorMessage:
              'Skipped duplicate forced local demo email delivery.',
          });
          continue;
        }

        const recipient = this.resolveRecipient(
          member,
          channel,
          campaign.category,
          forcedTestRecipient,
        );
        this.logger.log(
          `campaign=${campaign._id.toString()} member=${member._id.toString()} template=${campaign.templateType} channel=${channel} resolvedRecipient=${recipient ?? 'unavailable'}`,
        );

        if (!recipient) {
          channelSummary[channel].skipped += 1;
          this.recordRecipientResult(recipientResults, member, channel, {
            status: 'skipped',
            errorMessage:
              channel === NotificationChannel.TELEGRAM
                ? 'Telegram customer is not linked or has unsubscribed.'
                : `Recipient unavailable for channel ${channel}.`,
          });
          logs.push({
            campaignId: campaign._id,
            memberId: member._id,
            category: campaign.category,
            channel,
            recipient: 'unavailable',
            status: NotificationLogStatus.FAILED,
            messageSubject: campaign.messageSubject,
            messageBody: campaign.messageBody,
            errorMessage: `Recipient unavailable for channel ${channel}.`,
          });
          continue;
        }

        try {
          const rendered = this.renderCampaignContent(campaign, member);
          const storeSpecificMobileRecord =
            this.shouldStoreSpecificMobileRecord(campaign.templateType, channel);
          const pushMetadata = await this.resolvePushMetadata(campaign, member);
          const result = await this.notificationDeliveryService.deliver({
            channel,
            recipient,
            memberId: member._id.toString(),
            category: campaign.category,
            subject: rendered.subject,
            messageBody: this.resolveChannelBody(channel, rendered),
            htmlBody:
              channel === NotificationChannel.EMAIL ? rendered.emailHtml : undefined,
            attachments:
              channel === NotificationChannel.EMAIL ? rendered.emailAttachments : undefined,
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
            deliveredAt:
              result.status === 'delivered' ? new Date() : undefined,
          });
          this.incrementChannelSummary(channelSummary, result.status, channel);
          this.recordRecipientResult(recipientResults, member, channel, {
            status: result.status,
            recipient,
            providerMessageId: result.providerMessageId,
            errorMessage: result.errorMessage,
          });
          if (channel === NotificationChannel.EMAIL && forcedTestRecipient) {
            forcedEmailAlreadySent = true;
          }

          this.logger.log(
            `campaign=${campaign._id.toString()} template=${campaign.templateType} channel=${channel} recipient=${recipient} status=${result.status}`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown campaign delivery error.';

          this.logger.error(
            `campaign=${campaign._id.toString()} template=${campaign.templateType} channel=${channel} recipient=${recipient} failed: ${message}`,
            error instanceof Error ? error.stack : undefined,
          );

          logs.push({
            campaignId: campaign._id,
            memberId: member._id,
            category: campaign.category,
            channel,
            recipient,
            status: NotificationLogStatus.FAILED,
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

    campaign.status = logs.some((log) => log.status === NotificationLogStatus.FAILED)
      ? NotificationCampaignStatus.FAILED
      : NotificationCampaignStatus.COMPLETED;
    campaign.sentAt = new Date();
    await campaign.save();

    this.logger.log(
      `campaign=${campaign._id.toString()} completed status=${campaign.status} logs=${logs.length}`,
    );

    if (logs.length > 0 && logs.every((log) => log.status === NotificationLogStatus.FAILED)) {
      throw new ServiceUnavailableException(
        logs.find((log) => log.errorMessage)?.errorMessage ??
          'Notification delivery failed for all selected channels.',
      );
    }

    const campaignPayload =
      typeof campaign.toObject === 'function'
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
    }) as CampaignSendResult;
  }

  private resolveCampaignText(
    preferredValue: string | undefined,
    fallbackValue: string | undefined,
  ) {
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

  async listLogs(currentUser: AuthenticatedUser, campaignId?: string) {
    this.ensureManagerAccess(currentUser);

    const scope = this.buildMemberScope(currentUser);
    const memberIds =
      Object.keys(scope).length > 0
        ? (
            await this.memberModel
              .find(scope)
              .select('_id')
              .lean<Array<{ _id: Types.ObjectId }>>()
          ).map((item) => item._id)
        : undefined;

    return this.notificationLogModel
      .find({
        ...(campaignId ? { campaignId: this.toObjectId(campaignId, 'campaignId') } : {}),
        ...(memberIds ? { memberId: { $in: memberIds } } : {}),
      })
      .sort({ createdAt: -1 })
      .lean<NotificationLogDocument[]>();
  }

  private async resolveTargets(
    currentUser: AuthenticatedUser,
    dto: CreateNotificationCampaignDto,
  ) {
    const scope = this.buildMemberScope(currentUser);
    const filter: Record<string, unknown> = { ...scope };

    if (dto.targetIds?.length) {
      const resolvedTargetFilters = this.buildTargetIdentifierFilter(dto.targetIds);
      if (resolvedTargetFilters.length === 1) {
        Object.assign(filter, resolvedTargetFilters[0]);
      } else {
        filter.$or = [...(Array.isArray(filter.$or) ? filter.$or : []), ...resolvedTargetFilters];
      }
    }

    if (dto.targetType === 'filtered_customers' && dto.filters) {
      if (typeof dto.filters.branchId === 'string') {
        filter.branchId = this.toObjectId(dto.filters.branchId, 'filters.branchId');
      }
      if (typeof dto.filters.districtId === 'string') {
        filter.districtId = this.toObjectId(
          dto.filters.districtId,
          'filters.districtId',
        );
      }
      if (typeof dto.filters.memberType === 'string') {
        filter.memberType = dto.filters.memberType;
      }
    }

    const members = await this.memberModel.find(filter);
    const membersWithLocalPushTarget = await this.appendForcedDemoPushTarget(
      members,
      dto.channels,
    );

    if (membersWithLocalPushTarget.length === 0) {
      throw new NotFoundException('No target customers matched this campaign.');
    }

    return membersWithLocalPushTarget;
  }

  private resolveRecipient(
    member: MemberDocument,
    channel: NotificationChannel,
    category: NotificationCategory,
    demoRecipientEmail?: string,
  ) {
    switch (channel) {
      case NotificationChannel.MOBILE_PUSH:
        return member._id.toString();
      case NotificationChannel.EMAIL:
        return demoRecipientEmail || member.email || this.testEmailRecipient;
      case NotificationChannel.SMS:
        return member.phone;
      case NotificationChannel.TELEGRAM:
        if (this.resolveForcedTelegramChatId()) {
          return this.resolveForcedTelegramChatId();
        }

        return this.canReceiveTelegram(member, category)
          ? member.telegramChatId || member.telegramUserId
          : undefined;
      case NotificationChannel.IN_APP:
        return member.phone;
    }
  }

  private renderCampaignContent(
    campaign: NotificationCampaignDocument,
    member: MemberDocument,
  ) {
    return this.templateRendererService.render({
      templateType: campaign.templateType,
      subject: campaign.messageSubject,
      customMessageBody: campaign.messageBody,
      member,
    });
  }

  private buildCampaignFilters(dto: CreateNotificationCampaignDto) {
    const emailRecipient = this.resolveForcedEmailRecipient(dto.demoRecipientEmail);

    return emailRecipient ? { demoRecipientEmail: emailRecipient } : {};
  }

  private async appendForcedDemoPushTarget(
    members: MemberDocument[],
    channels: NotificationChannel[],
  ) {
    if (!this.isLocalDemoDeliveryMode()) {
      return members;
    }

    if (
      !this.normalizeChannels(channels).some((channel) =>
        [NotificationChannel.MOBILE_PUSH, NotificationChannel.IN_APP].includes(channel),
      )
    ) {
      return members;
    }

    if (
      !this.forceTestPushCustomerId ||
      members.some(
        (member) =>
          member.customerId === this.forceTestPushCustomerId ||
          member.memberNumber === this.forceTestPushCustomerId,
      )
    ) {
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

  private normalizeChannels(channels: NotificationChannel[]) {
    return Array.from(new Set(channels));
  }

  private shouldStoreSpecificMobileRecord(
    templateType: string,
    channel: NotificationChannel,
  ) {
    return (
      templateType === NotificationTemplateType.SCHOOL_PAYMENT_DUE &&
      [NotificationChannel.MOBILE_PUSH, NotificationChannel.IN_APP].includes(channel)
    );
  }

  private async storeSpecificMobileNotification(input: {
    campaign: NotificationCampaignDocument;
    member: MemberDocument;
    result: Awaited<ReturnType<NotificationDeliveryService['deliver']>>;
  }) {
    if (input.campaign.templateType !== NotificationTemplateType.SCHOOL_PAYMENT_DUE) {
      return;
    }

    const autoPayEnabled = await this.hasEnabledSchoolAutopay(input.member._id);
    const title = autoPayEnabled ? 'School fee reminder' : 'School fee due';
    const message = autoPayEnabled
      ? 'Your school payment is already scheduled with AutoPay. Review the schedule in School Pay if any change is needed.'
      : this.resolveCampaignText(
          input.campaign.messageBody,
          'Your school fee is due soon. Open School Pay to review the student profile and complete payment.',
        );

    await this.notificationsService.storeNotificationRecord({
      userType: 'member',
      userId: input.member._id.toString(),
      userRole: input.member.role,
      type: NotificationType.SCHOOL_PAYMENT_DUE,
      channel: NotificationChannel.MOBILE_PUSH,
      status:
        input.result.status === 'failed'
          ? NotificationStatus.FAILED
          : NotificationStatus.SENT,
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

  private async hasEnabledSchoolAutopay(memberId: Types.ObjectId) {
    const match = await this.autopaySettingModel.exists({
      memberId,
      serviceType: 'school_payment',
      enabled: true,
    });

    return Boolean(match);
  }

  private async resolvePushMetadata(
    campaign: NotificationCampaignDocument,
    member: MemberDocument,
  ) {
    if (campaign.templateType === NotificationTemplateType.SCHOOL_PAYMENT_DUE) {
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

  private resolveChannelBody(
    channel: NotificationChannel,
    rendered: ReturnType<NotificationCampaignService['renderCampaignContent']>,
  ) {
    switch (channel) {
      case NotificationChannel.MOBILE_PUSH:
        return rendered.inAppMessage;
      case NotificationChannel.EMAIL:
        return rendered.emailText;
      case NotificationChannel.SMS:
        return rendered.smsMessage;
      case NotificationChannel.TELEGRAM:
        return rendered.telegramMessage;
      case NotificationChannel.IN_APP:
        return rendered.inAppMessage;
    }
  }

  private buildCampaignScope(currentUser: AuthenticatedUser) {
    return { createdBy: this.toObjectId(currentUser.sub, 'currentUser.sub') };
  }

  private buildMemberScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { branchId: this.toObjectId(currentUser.branchId, 'currentUser.branchId') };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return {
        districtId: this.toObjectId(currentUser.districtId, 'currentUser.districtId'),
      };
    }

    return {};
  }

  private toObjectId(value: string, fieldName: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`${fieldName} must be a valid ObjectId.`);
    }

    return new Types.ObjectId(value);
  }

  private ensureManagerAccess(currentUser: AuthenticatedUser) {
    if (
      ![
        UserRole.BRANCH_MANAGER,
        UserRole.DISTRICT_MANAGER,
        UserRole.DISTRICT_OFFICER,
        UserRole.HEAD_OFFICE_MANAGER,
        UserRole.HEAD_OFFICE_OFFICER,
        UserRole.ADMIN,
      ].includes(currentUser.role)
    ) {
      throw new ForbiddenException('Only managers can manage notification campaigns.');
    }
  }

  private resolveForcedEmailRecipient(demoRecipientEmail?: string) {
    if (!this.isLocalDemoDeliveryMode()) {
      return undefined;
    }

    return demoRecipientEmail || this.forceTestEmailRecipient || this.testEmailRecipient;
  }

  private isLocalDemoDeliveryMode() {
    return this.demoMode || this.nodeEnv === 'development';
  }

  private resolveForcedTelegramChatId() {
    if (!this.isLocalDemoDeliveryMode()) {
      return undefined;
    }

    return this.forceTestTelegramChatId || undefined;
  }

  private canReceiveTelegram(
    member: MemberDocument,
    category: NotificationCategory,
  ) {
    if (!member.telegramSubscribed || !member.telegramChatId) {
      return false;
    }

    if (
      category === NotificationCategory.LOAN &&
      member.optInLoanReminders === false
    ) {
      return false;
    }

    if (
      category === NotificationCategory.INSURANCE &&
      member.optInInsuranceReminders === false
    ) {
      return false;
    }

    return true;
  }

  private createChannelSummary(channels: NotificationChannel[]) {
    return Object.fromEntries(
      channels.map((channel) => [
        channel,
        {
          sent: 0,
          delivered: 0,
          failed: 0,
          skipped: 0,
        },
      ]),
    ) as Record<string, CampaignSendChannelSummary>;
  }

  private incrementChannelSummary(
    summary: Record<string, CampaignSendChannelSummary>,
    status: 'sent' | 'delivered' | 'failed',
    channel: NotificationChannel,
  ) {
    summary[channel][status] += 1;
  }

  private recordRecipientResult(
    recipientResults: Map<
      string,
      {
        customerId: string;
        memberId: string;
        channels: Record<
          string,
          {
            status: 'sent' | 'delivered' | 'failed' | 'skipped';
            recipient?: string;
            providerMessageId?: string;
            errorMessage?: string;
          }
        >;
      }
    >,
    member: MemberDocument,
    channel: NotificationChannel,
    result: {
      status: 'sent' | 'delivered' | 'failed' | 'skipped';
      recipient?: string;
      providerMessageId?: string;
      errorMessage?: string;
    },
  ) {
    const memberId = member._id.toString();
    const existing =
      recipientResults.get(memberId) ??
      {
        customerId: member.customerId,
        memberId,
        channels: {},
      };

    existing.channels[channel] = result;
    recipientResults.set(memberId, existing);
  }

  private buildTargetIdentifierFilter(targetIds: string[]) {
    return targetIds.flatMap((value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      const variants = new Set([
        trimmed,
        trimmed.toUpperCase(),
      ]);

      const filters: Array<Record<string, unknown>> = [
        { customerId: { $in: Array.from(variants) } },
        { memberNumber: { $in: Array.from(variants) } },
        { phone: trimmed },
      ];

      if (Types.ObjectId.isValid(trimmed)) {
        filters.unshift({ _id: new Types.ObjectId(trimmed) });
      }

      return filters;
    });
  }
}
