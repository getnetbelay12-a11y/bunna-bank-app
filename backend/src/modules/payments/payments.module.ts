import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchoolReportsModule } from '../school-reports/school-reports.module';
import { SchoolPaymentsModule } from '../school-payments/school-payments.module';
import {
  ServiceRequest,
  ServiceRequestSchema,
} from '../service-requests/schemas/service-request.schema';
import {
  MemberSecuritySetting,
  MemberSecuritySettingSchema,
} from '../service-placeholders/schemas/member-security-setting.schema';
import { SavingsAccount, SavingsAccountSchema } from '../savings/schemas/savings-account.schema';
import {
  PAYMENT_NOTIFICATION_PORT,
} from './payment-notification.port';
import { PaymentNotificationService } from './payment-notification.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SchoolPayment, SchoolPaymentSchema } from './schemas/school-payment.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    SchoolPaymentsModule,
    SchoolReportsModule,
    StudentsModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: SchoolPayment.name, schema: SchoolPaymentSchema },
      { name: SavingsAccount.name, schema: SavingsAccountSchema },
      { name: Member.name, schema: MemberSchema },
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      {
        name: MemberSecuritySetting.name,
        schema: MemberSecuritySettingSchema,
      },
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
