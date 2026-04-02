import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  NotificationCampaignStatus,
  NotificationChannel,
  NotificationLogStatus,
  UserRole,
} from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationTemplateService } from './notification-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { CreateNotificationCampaignDto } from './dto';
import {
  NotificationCampaign,
  NotificationCampaignDocument,
} from './schemas/notification-campaign.schema';
import { NotificationLog, NotificationLogDocument } from './schemas/notification-log.schema';

@Injectable()
export class NotificationCampaignService {
  private readonly logger = new Logger(NotificationCampaignService.name);
  private readonly demoFallbackEmail =
    process.env.TEST_EMAIL_RECIPIENT ||
    process.env.DEMO_NOTIFICATION_EMAIL ||
    'write2get@gmail.com';

  constructor(
    @InjectModel(NotificationCampaign.name)
    private readonly notificationCampaignModel: Model<NotificationCampaignDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly notificationTemplateService: NotificationTemplateService,
    private readonly notificationDeliveryService: NotificationDeliveryService,
    private readonly templateRendererService: TemplateRendererService,
  ) {}

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

    const template = await this.notificationTemplateService.getTemplateByType(
      dto.templateType,
    );
    const forcedDemoRecipientEmail = dto.channels.includes(NotificationChannel.EMAIL)
      ? dto.demoRecipientEmail || this.demoFallbackEmail
      : undefined;
    const targets = await this.resolveTargets(
      currentUser,
      dto,
      forcedDemoRecipientEmail,
    );

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
        ? NotificationCampaignStatus.SCHEDULED
        : NotificationCampaignStatus.DRAFT,
      createdBy: new Types.ObjectId(currentUser.sub),
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  async getCampaign(currentUser: AuthenticatedUser, campaignId: string) {
    this.ensureManagerAccess(currentUser);
    const campaign = await this.notificationCampaignModel.findOne({
      _id: new Types.ObjectId(campaignId),
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

    campaign.status = NotificationCampaignStatus.SENDING;
    await campaign.save();

    const logs = [];
    const demoRecipientEmail =
      typeof campaign.filters?.demoRecipientEmail === 'string'
        ? campaign.filters.demoRecipientEmail
        : undefined;
    for (const member of members) {
      for (const channel of campaign.channels) {
        const recipient = this.resolveRecipient(
          member,
          channel,
          demoRecipientEmail,
        );
        const rendered = this.renderCampaignContent(campaign, member);
        if (!recipient) {
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

        const result = await this.notificationDeliveryService.deliver({
          channel,
          recipient,
          memberId: member._id.toString(),
          category: campaign.category,
          subject: rendered.subject,
          messageBody: this.resolveChannelBody(channel, rendered),
          htmlBody: channel === NotificationChannel.EMAIL ? rendered.emailHtml : undefined,
          userRole: member.role,
        });

        this.logger.log(
          `Reminder delivery ${result.status} channel=${channel} recipient=${recipient} template=${campaign.templateType}`,
        );

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

    return campaign;
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
        ...(campaignId ? { campaignId: new Types.ObjectId(campaignId) } : {}),
        ...(memberIds ? { memberId: { $in: memberIds } } : {}),
      })
      .sort({ createdAt: -1 })
      .lean<NotificationLogDocument[]>();
  }

  private async resolveTargets(
    currentUser: AuthenticatedUser,
    dto: CreateNotificationCampaignDto,
    forcedDemoRecipientEmail?: string,
  ) {
    const scope = this.buildMemberScope(currentUser);
    const filter: Record<string, unknown> = { ...scope };

    if (dto.targetIds?.length) {
      filter._id = { $in: dto.targetIds.map((id) => new Types.ObjectId(id)) };
    }

    if (dto.targetType === 'filtered_customers' && dto.filters) {
      if (typeof dto.filters.branchId === 'string') {
        filter.branchId = new Types.ObjectId(dto.filters.branchId);
      }
      if (typeof dto.filters.districtId === 'string') {
        filter.districtId = new Types.ObjectId(dto.filters.districtId);
      }
      if (typeof dto.filters.memberType === 'string') {
        filter.memberType = dto.filters.memberType;
      }
    }

    const members = await this.memberModel.find(filter);

    if (members.length === 0) {
      throw new NotFoundException('No target customers matched this campaign.');
    }

    return forcedDemoRecipientEmail ? members.slice(0, 1) : members;
  }

  private resolveRecipient(
    member: MemberDocument,
    channel: NotificationChannel,
    demoRecipientEmail?: string,
  ) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return demoRecipientEmail || member.email || this.demoFallbackEmail;
      case NotificationChannel.SMS:
      case NotificationChannel.TELEGRAM:
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
      useDemoContent: typeof campaign.filters?.demoRecipientEmail === 'string',
    });
  }

  private resolveChannelBody(
    channel: NotificationChannel,
    rendered: ReturnType<NotificationCampaignService['renderCampaignContent']>,
  ) {
    switch (channel) {
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
    return { createdBy: new Types.ObjectId(currentUser.sub) };
  }

  private buildMemberScope(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.BRANCH_MANAGER && currentUser.branchId) {
      return { branchId: new Types.ObjectId(currentUser.branchId) };
    }

    if (
      [UserRole.DISTRICT_MANAGER, UserRole.DISTRICT_OFFICER].includes(currentUser.role) &&
      currentUser.districtId
    ) {
      return { districtId: new Types.ObjectId(currentUser.districtId) };
    }

    return {};
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
}
