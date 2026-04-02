import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { SavingsAccount, SavingsAccountSchema } from '../savings/schemas/savings-account.schema';
import {
  PAYMENT_NOTIFICATION_PORT,
} from './payment-notification.port';
import { PaymentNotificationService } from './payment-notification.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SchoolPayment, SchoolPaymentSchema } from './schemas/school-payment.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: SchoolPayment.name, schema: SchoolPaymentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SavingsAccount.name, schema: SavingsAccountSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentNotificationService,
    {
      provide: PAYMENT_NOTIFICATION_PORT,
      useExisting: PaymentNotificationService,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
