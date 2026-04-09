import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { ChatConversation, ChatConversationSchema } from '../chat/schemas/chat-conversation.schema';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import { AutopaySetting, AutopaySettingSchema } from '../service-placeholders/schemas/autopay-setting.schema';
import { StaffActivityLog, StaffActivityLogSchema } from '../staff-activity/schemas/staff-activity-log.schema';
import { LoanWorkflowController } from './loan-workflow.controller';
import { LoanWorkflowService } from './loan-workflow.service';
import { LoanWorkflowHistory, LoanWorkflowHistorySchema } from './schemas/loan-workflow-history.schema';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: AutopaySetting.name, schema: AutopaySettingSchema },
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: LoanWorkflowHistory.name, schema: LoanWorkflowHistorySchema },
      { name: StaffActivityLog.name, schema: StaffActivityLogSchema },
    ]),
  ],
  controllers: [LoanWorkflowController],
  providers: [LoanWorkflowService],
  exports: [LoanWorkflowService],
})
export class LoanWorkflowModule {}
