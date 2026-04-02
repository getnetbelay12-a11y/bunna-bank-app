import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ServicePlaceholdersController } from './service-placeholders.controller';
import {
  AccountMemberRequest,
  AccountMemberRequestSchema,
} from './schemas/account-member-request.schema';
import { AtmCardRequest, AtmCardRequestSchema } from './schemas/atm-card-request.schema';
import { AutopaySetting, AutopaySettingSchema } from './schemas/autopay-setting.schema';
import {
  MemberSecuritySetting,
  MemberSecuritySettingSchema,
} from './schemas/member-security-setting.schema';
import {
  PhoneUpdateRequest,
  PhoneUpdateRequestSchema,
} from './schemas/phone-update-request.schema';
import {
  SelfieVerification,
  SelfieVerificationSchema,
} from './schemas/selfie-verification.schema';
import { ServicePlaceholdersService } from './service-placeholders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AutopaySetting.name, schema: AutopaySettingSchema },
      { name: MemberSecuritySetting.name, schema: MemberSecuritySettingSchema },
      { name: AtmCardRequest.name, schema: AtmCardRequestSchema },
      { name: PhoneUpdateRequest.name, schema: PhoneUpdateRequestSchema },
      { name: AccountMemberRequest.name, schema: AccountMemberRequestSchema },
      { name: SelfieVerification.name, schema: SelfieVerificationSchema },
    ]),
  ],
  controllers: [ServicePlaceholdersController],
  providers: [ServicePlaceholdersService],
})
export class ServicePlaceholdersModule {}
