import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StorageService } from '../../common/storage/storage.service';
import { AuditModule } from '../audit/audit.module';
import { LoanWorkflowHistory, LoanWorkflowHistorySchema } from '../loan-workflow/schemas/loan-workflow-history.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { LoanDocumentMetadata, LoanDocumentMetadataSchema } from './schemas/loan-document.schema';
import { Loan, LoanSchema } from './schemas/loan.schema';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: LoanDocumentMetadata.name, schema: LoanDocumentMetadataSchema },
      { name: LoanWorkflowHistory.name, schema: LoanWorkflowHistorySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [LoansController],
  providers: [LoansService, StorageService],
  exports: [LoansService],
})
export class LoansModule {}
