import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { ManagerServiceRequestsController } from './manager-service-requests.controller';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.schema';
import {
  ServiceRequestEvent,
  ServiceRequestEventSchema,
} from './schemas/service-request-event.schema';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: ServiceRequestEvent.name, schema: ServiceRequestEventSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [ServiceRequestsController, ManagerServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
