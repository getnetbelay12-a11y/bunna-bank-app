import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { Branch, BranchSchema } from '../members/schemas/branch.schema';
import { District, DistrictSchema } from '../members/schemas/district.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  MemberSecuritySetting,
  MemberSecuritySettingSchema,
} from '../service-placeholders/schemas/member-security-setting.schema';
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
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Vote.name, schema: VoteSchema },
      { name: VoteOption.name, schema: VoteOptionSchema },
      { name: VoteResponse.name, schema: VoteResponseSchema },
      { name: VoteAuditLog.name, schema: VoteAuditLogSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: District.name, schema: DistrictSchema },
      {
        name: MemberSecuritySetting.name,
        schema: MemberSecuritySettingSchema,
      },
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
