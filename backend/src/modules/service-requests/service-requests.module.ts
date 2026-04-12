import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { Staff, StaffSchema } from '../staff/schemas/staff.schema';
import { ManagerServiceRequestsController } from './manager-service-requests.controller';
import {
  ReportingJobState,
  ReportingJobStateSchema,
} from './schemas/reporting-job-state.schema';
import {
  SecurityReviewDailySnapshot,
  SecurityReviewDailySnapshotSchema,
} from './schemas/security-review-daily-snapshot.schema';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.schema';
import {
  ServiceRequestEvent,
  ServiceRequestEventSchema,
} from './schemas/service-request-event.schema';
import { ServiceRequestsController } from './service-requests.controller';
import { SecurityReviewSnapshotSchedulerService } from './security-review-snapshot-scheduler.service';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: ServiceRequestEvent.name, schema: ServiceRequestEventSchema },
      {
        name: SecurityReviewDailySnapshot.name,
        schema: SecurityReviewDailySnapshotSchema,
      },
      {
        name: ReportingJobState.name,
        schema: ReportingJobStateSchema,
      },
      { name: Member.name, schema: MemberSchema },
      { name: Staff.name, schema: StaffSchema },
    ]),
  ],
  controllers: [ServiceRequestsController, ManagerServiceRequestsController],
  providers: [ServiceRequestsService, SecurityReviewSnapshotSchedulerService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
