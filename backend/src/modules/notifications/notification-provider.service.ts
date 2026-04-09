import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '../../common/enums';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import {
  ChannelNotificationProvider,
  EMAIL_NOTIFICATION_PROVIDER,
  MOBILE_PUSH_NOTIFICATION_PROVIDER,
  SMS_NOTIFICATION_PROVIDER,
} from './channel-notification-provider.port';
import {
  NotificationDispatchPayload,
  NotificationDispatchResult,
  NotificationProviderPort,
} from './notification-provider.port';

@Injectable()
export class NotificationProviderService implements NotificationProviderPort {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @Inject(MOBILE_PUSH_NOTIFICATION_PROVIDER)
    private readonly mobilePushProvider: ChannelNotificationProvider,
    @Inject(EMAIL_NOTIFICATION_PROVIDER)
    private readonly emailProvider: ChannelNotificationProvider,
    @Inject(SMS_NOTIFICATION_PROVIDER)
    private readonly smsProvider: ChannelNotificationProvider,
  ) {}

  async dispatch(
    payload: NotificationDispatchPayload,
  ): Promise<NotificationDispatchResult> {
    const category = this.resolveCategory(payload.type);
    const preferredChannel =
      payload.preferredChannel ?? NotificationChannel.MOBILE_PUSH;
    const member = payload.userType === 'member'
      ? await this.memberModel
          .findById(new Types.ObjectId(payload.userId))
          .lean<MemberDocument | null>()
      : null;

    if (preferredChannel === NotificationChannel.MOBILE_PUSH) {
      const pushResult = await this.mobilePushProvider.send({
        channel: NotificationChannel.MOBILE_PUSH,
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
          channel: NotificationChannel.MOBILE_PUSH,
          status: NotificationStatus.SENT,
          deliveredAt: new Date(),
          category,
        };
      }

      if (member?.email) {
        const emailResult = await this.emailProvider.send({
          channel: NotificationChannel.EMAIL,
          recipient: member.email,
          memberId: payload.userId,
          category,
          subject: payload.title,
          messageBody: payload.message,
        });

        if (emailResult.status !== 'failed') {
          return {
            channel: NotificationChannel.EMAIL,
            fallbackChannel: NotificationChannel.MOBILE_PUSH,
            status: NotificationStatus.SENT,
            deliveredAt: new Date(),
            category,
          };
        }
      }

      if (payload.priority === 'high' && member?.phone) {
        const smsResult = await this.smsProvider.send({
          channel: NotificationChannel.SMS,
          recipient: member.phone,
          memberId: payload.userId,
          category,
          subject: payload.title,
          messageBody: payload.message,
        });

        if (smsResult.status !== 'failed') {
          return {
            channel: NotificationChannel.SMS,
            fallbackChannel: NotificationChannel.MOBILE_PUSH,
            status: NotificationStatus.SENT,
            deliveredAt: new Date(),
            category,
          };
        }
      }

      return {
        channel: NotificationChannel.MOBILE_PUSH,
        status: NotificationStatus.FAILED,
        errorMessage: pushResult.errorMessage,
        category,
      };
    }

    if (preferredChannel === NotificationChannel.EMAIL && member?.email) {
      const emailResult = await this.emailProvider.send({
        channel: NotificationChannel.EMAIL,
        recipient: member.email,
        memberId: payload.userId,
        category,
        subject: payload.title,
        messageBody: payload.message,
      });

      return {
        channel: NotificationChannel.EMAIL,
        status:
          emailResult.status === 'failed'
            ? NotificationStatus.FAILED
            : NotificationStatus.SENT,
        deliveredAt:
          emailResult.status === 'failed' ? undefined : new Date(),
        errorMessage: emailResult.errorMessage,
        category,
      };
    }

    return {
      channel: preferredChannel,
      status: NotificationStatus.FAILED,
      errorMessage: 'No recipient or provider was available for the selected channel.',
      category,
    };
  }

  private resolveCategory(type: NotificationType): NotificationCategory {
    switch (type) {
      case NotificationType.LOAN_DUE:
      case NotificationType.LOAN_OVERDUE:
      case NotificationType.LOAN_APPROVED:
      case NotificationType.LOAN_REJECTED:
      case NotificationType.LOAN_DOCUMENT_REQUIRED:
      case NotificationType.LOAN_DISBURSED:
      case NotificationType.LOAN_STATUS:
        return NotificationCategory.LOAN;
      case NotificationType.INSURANCE_DUE:
      case NotificationType.INSURANCE_RENEWAL_DUE:
      case NotificationType.INSURANCE_EXPIRING:
      case NotificationType.INSURANCE_EXPIRED:
      case NotificationType.LOAN_LINKED_INSURANCE_REMINDER:
      case NotificationType.INSURANCE:
        return NotificationCategory.INSURANCE;
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.SCHOOL_PAYMENT_DUE:
      case NotificationType.PAYMENT:
        return NotificationCategory.PAYMENT;
      case NotificationType.AUTOPAY_SUCCESS:
      case NotificationType.AUTOPAY_FAILED:
        return NotificationCategory.AUTOPAY;
      case NotificationType.SUPPORT_ASSIGNED:
      case NotificationType.SUPPORT_REPLY:
      case NotificationType.SUPPORT_RESOLVED:
      case NotificationType.CHAT:
      case NotificationType.SERVICE_REQUEST:
        return NotificationCategory.SUPPORT;
      case NotificationType.LOGIN_DETECTED:
      case NotificationType.SUSPICIOUS_LOGIN:
      case NotificationType.ACCOUNT_LOCKED:
      case NotificationType.ACCOUNT_UNLOCKED:
      case NotificationType.PHONE_NUMBER_CHANGE_REQUESTED:
      case NotificationType.PHONE_NUMBER_CHANGE_COMPLETED:
        return NotificationCategory.SECURITY;
      case NotificationType.KYC_SUBMITTED:
      case NotificationType.KYC_VERIFIED:
      case NotificationType.KYC_REJECTED:
      case NotificationType.KYC_NEED_MORE_INFORMATION:
        return NotificationCategory.KYC;
      case NotificationType.SHAREHOLDER_ANNOUNCEMENT:
      case NotificationType.VOTE_OPEN:
      case NotificationType.VOTE_CLOSING_SOON:
      case NotificationType.VOTE_RESULT_PUBLISHED:
      case NotificationType.SHAREHOLDER_VOTE:
      case NotificationType.VOTING:
        return NotificationCategory.SHAREHOLDER;
      case NotificationType.ANNOUNCEMENT:
      case NotificationType.CAMPAIGN:
      case NotificationType.SYSTEM:
      default:
        return NotificationCategory.SYSTEM;
    }
  }
}
