import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { NotificationChannel, NotificationType } from '../common/enums';
import { AppModule } from '../app.module';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { Member, MemberDocument } from '../modules/members/schemas/member.schema';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const memberModel = app.get<Model<MemberDocument>>(getModelToken(Member.name));
    const notificationsService = app.get(NotificationsService);
    const customerId = process.argv[2] ?? 'BUN-100001';

    const member = await memberModel.findOne({ customerId }).lean<MemberDocument | null>();

    if (!member) {
      throw new Error(`Seeded member ${customerId} was not found.`);
    }

    const result = await notificationsService.createNotification({
      userType: 'member',
      userId: member._id.toString(),
      userRole: member.role,
      type: NotificationType.SCHOOL_PAYMENT_DUE,
      channel: NotificationChannel.MOBILE_PUSH,
      status: undefined,
      title: 'School fee due today',
      message:
        'Bright Future School fee is due today. Tap to open School Pay and complete the payment.',
      entityType: 'school_payment',
      actionLabel: 'Pay now',
      priority: 'high',
      deepLink: '/payments/school',
      dataPayload: {
        serviceType: 'school_payment',
        autoPayEnabled: false,
      },
    });

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          ok: true,
          customerId,
          notificationId: result.id,
          deepLink: result.deepLink,
          channel: result.channel,
          status: result.status,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

void main();
