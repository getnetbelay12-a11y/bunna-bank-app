import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MemberProfilesModule } from '../member-profiles/member-profiles.module';
import { IdentityVerificationController } from './identity-verification.controller';
import {
  FAYDA_VERIFICATION_PROVIDER,
  IdentityVerificationService,
} from './identity-verification.service';
import {
  OfficialFaydaVerificationProvider,
} from './providers/official-fayda.provider';
import {
  ManualReviewFaydaVerificationProvider,
} from './providers/manual-review-fayda.provider';
import {
  IdentityVerification,
  IdentityVerificationSchema,
} from './schemas/identity-verification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdentityVerification.name, schema: IdentityVerificationSchema },
    ]),
    MemberProfilesModule,
  ],
  controllers: [IdentityVerificationController],
  providers: [
    IdentityVerificationService,
    OfficialFaydaVerificationProvider,
    ManualReviewFaydaVerificationProvider,
    {
      provide: FAYDA_VERIFICATION_PROVIDER,
      inject: [
        ConfigService,
        OfficialFaydaVerificationProvider,
        ManualReviewFaydaVerificationProvider,
      ],
      useFactory: (
        configService: ConfigService,
        officialProvider: OfficialFaydaVerificationProvider,
        manualProvider: ManualReviewFaydaVerificationProvider,
      ) => {
        return configService.get<string>('FAYDA_PROVIDER_MODE') === 'official'
          ? officialProvider
          : manualProvider;
      },
    },
  ],
  exports: [IdentityVerificationService, FAYDA_VERIFICATION_PROVIDER],
})
export class IdentityVerificationModule {}
