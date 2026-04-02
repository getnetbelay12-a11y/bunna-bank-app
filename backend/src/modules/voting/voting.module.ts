import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { VoteOtpService } from './vote-otp.service';
import { VOTE_OTP_PORT } from './vote-otp.port';
import { VoteAuditLog, VoteAuditLogSchema } from './schemas/vote-audit-log.schema';
import { VoteOption, VoteOptionSchema } from './schemas/vote-option.schema';
import { VoteResponse, VoteResponseSchema } from './schemas/vote-response.schema';
import { Vote, VoteSchema } from './schemas/vote.schema';
import { VotingController } from './voting.controller';
import { VotingService } from './voting.service';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: Vote.name, schema: VoteSchema },
      { name: VoteOption.name, schema: VoteOptionSchema },
      { name: VoteResponse.name, schema: VoteResponseSchema },
      { name: VoteAuditLog.name, schema: VoteAuditLogSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [VotingController],
  providers: [
    VotingService,
    VoteOtpService,
    {
      provide: VOTE_OTP_PORT,
      useExisting: VoteOtpService,
    },
  ],
  exports: [VotingService],
})
export class VotingModule {}
