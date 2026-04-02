import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { StaffActivityLog, StaffActivityLogSchema } from '../staff-activity/schemas/staff-activity-log.schema';
import { LoanWorkflowController } from './loan-workflow.controller';
import { LoanWorkflowService } from './loan-workflow.service';
import { LoanWorkflowHistory, LoanWorkflowHistorySchema } from './schemas/loan-workflow-history.schema';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: LoanWorkflowHistory.name, schema: LoanWorkflowHistorySchema },
      { name: StaffActivityLog.name, schema: StaffActivityLogSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [LoanWorkflowController],
  providers: [LoanWorkflowService],
  exports: [LoanWorkflowService],
})
export class LoanWorkflowModule {}
