import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { IdentityVerificationModule } from '../identity-verification/identity-verification.module';
import { MemberProfilesModule } from '../member-profiles/member-profiles.module';
import { Branch, BranchSchema } from '../members/schemas/branch.schema';
import { District, DistrictSchema } from '../members/schemas/district.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  MemberSecuritySetting,
  MemberSecuritySettingSchema,
} from '../service-placeholders/schemas/member-security-setting.schema';
import { Staff, StaffSchema } from '../staff/schemas/staff.schema';
import { AuthSecurityService } from './auth-security.service';
import {
  MEMBER_AUTH_REPOSITORY,
  STAFF_AUTH_REPOSITORY,
} from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseMemberAuthRepository } from './repositories/member-auth.repository';
import { MongooseStaffAuthRepository } from './repositories/staff-auth.repository';
import { AuthSession, AuthSessionSchema } from './schemas/auth-session.schema';
import { Device, DeviceSchema } from './schemas/device.schema';
import {
  OnboardingEvidence,
  OnboardingEvidenceSchema,
} from './schemas/onboarding-evidence.schema';
import {
  StaffStepUpToken,
  StaffStepUpTokenSchema,
} from './schemas/staff-step-up-token.schema';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    MemberProfilesModule,
    IdentityVerificationModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Branch.name, schema: BranchSchema },
      { name: District.name, schema: DistrictSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: OnboardingEvidence.name, schema: OnboardingEvidenceSchema },
      { name: StaffStepUpToken.name, schema: StaffStepUpTokenSchema },
      { name: MemberSecuritySetting.name, schema: MemberSecuritySettingSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const auth = configService.getOrThrow<{
          jwtSecret: string;
          jwtIssuer: string;
          jwtAudience: string;
        }>('auth');

        return {
          secret: auth.jwtSecret,
          signOptions: {
            issuer: auth.jwtIssuer,
            audience: auth.jwtAudience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSecurityService,
    JwtStrategy,
    MongooseMemberAuthRepository,
    MongooseStaffAuthRepository,
    {
      provide: MEMBER_AUTH_REPOSITORY,
      useExisting: MongooseMemberAuthRepository,
    },
    {
      provide: STAFF_AUTH_REPOSITORY,
      useExisting: MongooseStaffAuthRepository,
    },
  ],
  exports: [AuthService, AuthSecurityService],
})
export class AuthModule {}
