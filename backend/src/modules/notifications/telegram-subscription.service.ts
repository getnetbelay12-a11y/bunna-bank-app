import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import { NotificationCategory, NotificationChannel, UserRole } from '../../common/enums';
import { AuthenticatedUser } from '../auth/interfaces';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { EmailNotificationProvider } from './providers/email-notification.provider';
import {
  TelegramLinkCode,
  TelegramLinkCodeDocument,
} from './schemas/telegram-link-code.schema';
import { TelegramNotificationProvider } from './providers/telegram-notification.provider';

type TelegramMessageUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
    };
    from?: {
      id?: number | string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date?: number;
  };
  edited_message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
    };
    from?: {
      id?: number | string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    date?: number;
  };
};

@Injectable()
export class TelegramSubscriptionService {
  private readonly logger = new Logger(TelegramSubscriptionService.name);
  private readonly webhookSecret: string;

  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(TelegramLinkCode.name)
    private readonly telegramLinkCodeModel: Model<TelegramLinkCodeDocument>,
    private readonly configService: ConfigService,
    private readonly emailNotificationProvider: EmailNotificationProvider,
    private readonly telegramNotificationProvider: TelegramNotificationProvider,
  ) {
    this.webhookSecret =
      this.configService.get<string>('notifications.telegram.webhookSecret') ?? '';
  }

  async getMySubscription(currentUser: AuthenticatedUser) {
    this.ensureMemberAccess(currentUser);

    const member = await this.memberModel.findById(currentUser.sub);
    if (!member) {
      throw new BadRequestException('Member not found.');
    }

    return this.toSubscriptionStatus(member);
  }

  async createLinkCode(
    currentUser: AuthenticatedUser,
    expiresInMinutes = 15,
  ) {
    this.ensureMemberAccess(currentUser);

    const member = await this.memberModel.findById(currentUser.sub);
    if (!member) {
      throw new BadRequestException('Member not found.');
    }

    await this.telegramLinkCodeModel.deleteMany({
      memberId: new Types.ObjectId(currentUser.sub),
      usedAt: { $exists: false },
    });

    const code = this.generateLinkCode();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await this.telegramLinkCodeModel.create({
      memberId: new Types.ObjectId(currentUser.sub),
      customerId: member.customerId,
      code,
      expiresAt,
    });

    this.logger.log(
      `telegram link code created memberId=${currentUser.sub} customerId=${member.customerId} expiresAt=${expiresAt.toISOString()}`,
    );

    const emailRecipient = this.resolveLinkCodeEmailRecipient(member);
    if (emailRecipient) {
      const emailResult = await this.emailNotificationProvider.send({
        channel: NotificationChannel.EMAIL,
        recipient: emailRecipient,
        memberId: currentUser.sub,
        category: NotificationCategory.LOAN,
        subject: 'Your Bunna Bank Telegram Link Code',
        messageBody: [
          `Hello ${member.fullName},`,
          '',
          'Use the following code to link your Telegram bot subscription to your Bunna Bank customer profile:',
          code,
          '',
          'Open the Bunna Bank Telegram bot and send:',
          `/link ${code}`,
          '',
          `This code expires on ${expiresAt.toISOString()}.`,
        ].join('\n'),
      });

      this.logger.log(
        `telegram link code email recipient=${emailRecipient} status=${emailResult.status}`,
      );
    }

    return {
      code,
      expiresAt,
      emailedTo: emailRecipient,
      instructions:
        'Open the Bunna Bank Telegram bot and send /link <code> to connect your account.',
    };
  }

  async updateMyPreferences(
    currentUser: AuthenticatedUser,
    input: {
      telegramSubscribed?: boolean;
      optInLoanReminders?: boolean;
      optInInsuranceReminders?: boolean;
    },
  ) {
    this.ensureMemberAccess(currentUser);

    const member = await this.memberModel.findByIdAndUpdate(
      currentUser.sub,
      {
        $set: {
          ...(input.telegramSubscribed !== undefined
            ? { telegramSubscribed: input.telegramSubscribed }
            : {}),
          ...(input.optInLoanReminders !== undefined
            ? { optInLoanReminders: input.optInLoanReminders }
            : {}),
          ...(input.optInInsuranceReminders !== undefined
            ? { optInInsuranceReminders: input.optInInsuranceReminders }
            : {}),
        },
      },
      { new: true },
    );

    if (!member) {
      throw new BadRequestException('Member not found.');
    }

    return this.toSubscriptionStatus(member);
  }

  async handleWebhook(
    update: TelegramMessageUpdate,
    providedSecret?: string,
    providedHeaderSecret?: string,
  ) {
    this.ensureWebhookSecret(providedSecret, providedHeaderSecret);

    const message = update.message ?? update.edited_message;
    if (!message?.chat?.id) {
      return { ok: true, handled: false, reason: 'No message payload.' };
    }

    const chatId = String(message.chat.id);
    const userId = message.from?.id != null ? String(message.from.id) : undefined;
    const text = message.text?.trim() ?? '';

    await this.updateExistingSubscriptionMetadata(chatId, {
      telegramUserId: userId,
      telegramUsername: message.from?.username,
      telegramFirstName: message.from?.first_name,
      telegramLastName: message.from?.last_name,
      telegramLastMessageAt: new Date(),
    });

    if (!text) {
      await this.reply(chatId, this.helpMessage());
      return { ok: true, handled: true, action: 'help' };
    }

    if (text === '/start') {
      await this.reply(chatId, this.startMessage());
      return { ok: true, handled: true, action: 'start' };
    }

    if (text.startsWith('/start ') || text.startsWith('/link ')) {
      const code = text.split(/\s+/, 2)[1]?.trim();
      if (!code) {
        await this.reply(chatId, 'Please send /link <code> with the code generated in the Bunna Bank app.');
        return { ok: true, handled: true, action: 'link_missing_code' };
      }

      return this.linkChatId(code, {
        chatId,
        userId,
        username: message.from?.username,
        firstName: message.from?.first_name,
        lastName: message.from?.last_name,
      });
    }

    if (text === '/stop' || text === '/unsubscribe') {
      return this.updateSubscriptionFromCommand(chatId, {
        telegramSubscribed: false,
        optInLoanReminders: false,
        optInInsuranceReminders: false,
      }, 'You have been unsubscribed from Telegram reminders. Send /link <code> to reconnect later.');
    }

    if (text === '/unsubscribe_loan') {
      return this.updateSubscriptionFromCommand(
        chatId,
        { optInLoanReminders: false },
        'Loan reminders have been turned off for this Telegram account.',
      );
    }

    if (text === '/unsubscribe_insurance') {
      return this.updateSubscriptionFromCommand(
        chatId,
        { optInInsuranceReminders: false },
        'Insurance reminders have been turned off for this Telegram account.',
      );
    }

    if (text === '/subscribe_loan') {
      return this.updateSubscriptionFromCommand(
        chatId,
        { telegramSubscribed: true, optInLoanReminders: true },
        'Loan reminders are now active for this Telegram account.',
      );
    }

    if (text === '/subscribe_insurance') {
      return this.updateSubscriptionFromCommand(
        chatId,
        { telegramSubscribed: true, optInInsuranceReminders: true },
        'Insurance reminders are now active for this Telegram account.',
      );
    }

    await this.reply(chatId, this.helpMessage());
    return { ok: true, handled: true, action: 'help' };
  }

  private async linkChatId(
    code: string,
    input: {
      chatId: string;
      userId?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ) {
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();
    const linkCode = await this.telegramLinkCodeModel.findOne({
      code: normalizedCode,
      usedAt: { $exists: false },
      expiresAt: { $gt: now },
    });

    if (!linkCode) {
      await this.reply(
        input.chatId,
        'This link code is invalid or expired. Generate a new Telegram link code in the Bunna Bank app and try again.',
      );
      return { ok: true, handled: true, action: 'invalid_link_code' };
    }

    const member = await this.memberModel.findById(linkCode.memberId);
    if (!member) {
      await this.reply(input.chatId, 'We could not find the customer profile for this link code.');
      return { ok: true, handled: true, action: 'missing_member' };
    }

    await this.memberModel.updateMany(
      { telegramChatId: input.chatId, _id: { $ne: member._id } },
      {
        $unset: {
          telegramChatId: '',
          telegramUserId: '',
          telegramUsername: '',
          telegramFirstName: '',
          telegramLastName: '',
        },
        $set: {
          telegramSubscribed: false,
        },
      },
    );

    member.telegramChatId = input.chatId;
    member.telegramUserId = input.userId;
    member.telegramUsername = input.username;
    member.telegramFirstName = input.firstName;
    member.telegramLastName = input.lastName;
    member.telegramSubscribed = true;
    member.telegramLinkedAt = member.telegramLinkedAt ?? now;
    member.telegramLastMessageAt = now;
    member.optInLoanReminders = true;
    member.optInInsuranceReminders = true;
    await member.save();

    linkCode.usedAt = now;
    linkCode.usedByChatId = input.chatId;
    await linkCode.save();

    await this.reply(
      input.chatId,
      `Bunna Bank Telegram reminders are now linked to customer ${member.customerId}. Loan and insurance reminders will be sent here while your subscription remains active.`,
    );

    this.logger.log(
      `telegram linked memberId=${member._id.toString()} customerId=${member.customerId} chatId=${input.chatId}`,
    );

    return {
      ok: true,
      handled: true,
      action: 'linked',
      customerId: member.customerId,
    };
  }

  private async updateSubscriptionFromCommand(
    chatId: string,
    changes: {
      telegramSubscribed?: boolean;
      optInLoanReminders?: boolean;
      optInInsuranceReminders?: boolean;
    },
    successMessage: string,
  ) {
    const member = await this.memberModel.findOneAndUpdate(
      { telegramChatId: chatId },
      {
        $set: {
          ...changes,
          telegramLastMessageAt: new Date(),
        },
      },
      { new: true },
    );

    if (!member) {
      await this.reply(
        chatId,
        'This Telegram chat is not linked yet. Generate a link code in the Bunna Bank app and send /link <code> first.',
      );
      return { ok: true, handled: true, action: 'not_linked' };
    }

    await this.reply(chatId, successMessage);
    return {
      ok: true,
      handled: true,
      action: 'subscription_updated',
      customerId: member.customerId,
    };
  }

  private async updateExistingSubscriptionMetadata(
    chatId: string,
    changes: {
      telegramUserId?: string;
      telegramUsername?: string;
      telegramFirstName?: string;
      telegramLastName?: string;
      telegramLastMessageAt: Date;
    },
  ) {
    await this.memberModel.updateMany(
      { telegramChatId: chatId },
      {
        $set: changes,
      },
    );
  }

  private async reply(chatId: string, text: string) {
    await this.telegramNotificationProvider.sendTextMessage(chatId, text);
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser) {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException(
        'Only customer accounts can manage Telegram reminder linking.',
      );
    }
  }

  private ensureWebhookSecret(
    providedSecret?: string,
    providedHeaderSecret?: string,
  ) {
    if (!this.webhookSecret) {
      return;
    }

    const matchesRoute = providedSecret?.trim() === this.webhookSecret;
    const matchesHeader = providedHeaderSecret?.trim() === this.webhookSecret;
    if (!matchesRoute && !matchesHeader) {
      throw new ForbiddenException('Invalid Telegram webhook secret.');
    }
  }

  private generateLinkCode() {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  private resolveLinkCodeEmailRecipient(member: MemberDocument) {
    const forcedRecipient =
      this.configService.get<string>('notifications.email.forceTestRecipient') ??
      process.env.EMAIL_FORCE_TEST_RECIPIENT ??
      '';
    const testRecipient =
      this.configService.get<string>('notifications.email.testRecipient') ??
      process.env.TEST_EMAIL_RECIPIENT ??
      process.env.DEMO_NOTIFICATION_EMAIL ??
      'write2get@gmail.com';

    return forcedRecipient || testRecipient || member.email || null;
  }

  private startMessage() {
    return [
      'Welcome to Bunna Bank Telegram reminders.',
      '',
      'To link your bank profile, open the Bunna Bank app and generate a Telegram link code, then send:',
      '/link YOURCODE',
      '',
      'Available commands:',
      '/unsubscribe',
      '/unsubscribe_loan',
      '/unsubscribe_insurance',
      '/subscribe_loan',
      '/subscribe_insurance',
    ].join('\n');
  }

  private helpMessage() {
    return [
      'Bunna Bank Telegram reminders',
      '',
      'Send /link <code> to link your account.',
      'Send /unsubscribe to stop all Telegram reminders.',
      'Send /unsubscribe_loan or /unsubscribe_insurance to manage reminder categories.',
    ].join('\n');
  }

  private toSubscriptionStatus(member: MemberDocument | (MemberDocument & { _id?: Types.ObjectId })) {
    return {
      telegramLinked: Boolean(member.telegramChatId && member.telegramSubscribed),
      telegramChatId: member.telegramChatId,
      telegramUserId: member.telegramUserId,
      telegramUsername: member.telegramUsername,
      telegramLinkedAt: member.telegramLinkedAt,
      telegramLastMessageAt: member.telegramLastMessageAt,
      telegramSubscribed: member.telegramSubscribed ?? false,
      optInLoanReminders: member.optInLoanReminders ?? true,
      optInInsuranceReminders: member.optInInsuranceReminders ?? true,
    };
  }
}
