import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { CardManagementController } from './card-management.controller';
import { ManagerCardManagementController } from './card-management.controller';
import { CardManagementService } from './card-management.service';
import { Card, CardSchema } from './schemas/card.schema';
import { CardEvent, CardEventSchema } from './schemas/card-event.schema';
import { CardRequest, CardRequestSchema } from './schemas/card-request.schema';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Card.name, schema: CardSchema },
      { name: CardRequest.name, schema: CardRequestSchema },
      { name: CardEvent.name, schema: CardEventSchema },
    ]),
  ],
  controllers: [CardManagementController, ManagerCardManagementController],
  providers: [CardManagementService],
  exports: [CardManagementService],
})
export class CardManagementModule {}
