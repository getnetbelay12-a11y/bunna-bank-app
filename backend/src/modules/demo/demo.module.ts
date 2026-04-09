import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChatModule } from '../chat/chat.module';
import { Loan, LoanSchema } from '../loans/schemas/loan.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    NotificationsModule,
    ChatModule,
  ],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
