import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health.controller';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig, logMongoConnection } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { loadExternalMailEnvironment } from './config/external-mail-env';
import { loggingConfig } from './config/logging.config';
import { notificationsConfig } from './config/notifications.config';
import { storageConfig } from './config/storage.config';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { IdentityVerificationModule } from './modules/identity-verification/identity-verification.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { LocationsModule } from './modules/locations/locations.module';
import { LoanWorkflowModule } from './modules/loan-workflow/loan-workflow.module';
import { LoansModule } from './modules/loans/loans.module';
import { MemberProfilesModule } from './modules/member-profiles/member-profiles.module';
import { MembersModule } from './modules/members/members.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SavingsModule } from './modules/savings/savings.module';
import { ServicePlaceholdersModule } from './modules/service-placeholders/service-placeholders.module';
import { ShareholdersModule } from './modules/shareholders/shareholders.module';
import { StaffModule } from './modules/staff/staff.module';
import { StaffActivityModule } from './modules/staff-activity/staff-activity.module';
import { SupportModule } from './modules/support/support.module';
import { VotingModule } from './modules/voting/voting.module';
import { ChatModule } from './modules/chat/chat.module';

loadExternalMailEnvironment();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env.local',
        '.env',
      ],
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        notificationsConfig,
        storageConfig,
        loggingConfig,
      ],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const database = configService.getOrThrow<{
          uri: string;
          databaseName: string;
          host: string;
        }>('database');

        return {
          uri: database.uri,
          connectionFactory: (connection) =>
            logMongoConnection(connection, database.uri),
        };
      },
    }),
    AuthModule,
    AuditModule,
    MemberProfilesModule,
    IdentityVerificationModule,
    LocationsModule,
    InsuranceModule,
    MembersModule,
    PaymentsModule,
    LoansModule,
    LoanWorkflowModule,
    NotificationsModule,
    ChatModule,
    SupportModule,
    ServicePlaceholdersModule,
    SavingsModule,
    ShareholdersModule,
    StaffModule,
    VotingModule,
    StaffActivityModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
