"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const health_controller_1 = require("./health.controller");
const app_config_1 = require("./config/app.config");
const auth_config_1 = require("./config/auth.config");
const database_config_1 = require("./config/database.config");
const environment_validation_1 = require("./config/environment.validation");
const external_mail_env_1 = require("./config/external-mail-env");
const logging_config_1 = require("./config/logging.config");
const notifications_config_1 = require("./config/notifications.config");
const storage_config_1 = require("./config/storage.config");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const identity_verification_module_1 = require("./modules/identity-verification/identity-verification.module");
const insurance_module_1 = require("./modules/insurance/insurance.module");
const locations_module_1 = require("./modules/locations/locations.module");
const loan_workflow_module_1 = require("./modules/loan-workflow/loan-workflow.module");
const loans_module_1 = require("./modules/loans/loans.module");
const member_profiles_module_1 = require("./modules/member-profiles/member-profiles.module");
const members_module_1 = require("./modules/members/members.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const payments_module_1 = require("./modules/payments/payments.module");
const reports_module_1 = require("./modules/reports/reports.module");
const savings_module_1 = require("./modules/savings/savings.module");
const service_placeholders_module_1 = require("./modules/service-placeholders/service-placeholders.module");
const shareholders_module_1 = require("./modules/shareholders/shareholders.module");
const staff_module_1 = require("./modules/staff/staff.module");
const staff_activity_module_1 = require("./modules/staff-activity/staff-activity.module");
const support_module_1 = require("./modules/support/support.module");
const voting_module_1 = require("./modules/voting/voting.module");
const chat_module_1 = require("./modules/chat/chat.module");
(0, external_mail_env_1.loadExternalMailEnvironment)();
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    `.env.${process.env.NODE_ENV ?? 'development'}.local`,
                    `.env.${process.env.NODE_ENV ?? 'development'}`,
                    '.env.local',
                    '.env',
                ],
                load: [
                    app_config_1.appConfig,
                    auth_config_1.authConfig,
                    database_config_1.databaseConfig,
                    notifications_config_1.notificationsConfig,
                    storage_config_1.storageConfig,
                    logging_config_1.loggingConfig,
                ],
                validate: environment_validation_1.validateEnvironment,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const database = configService.getOrThrow('database');
                    return {
                        uri: database.uri,
                        connectionFactory: (connection) => (0, database_config_1.logMongoConnection)(connection, database.uri),
                    };
                },
            }),
            auth_module_1.AuthModule,
            audit_module_1.AuditModule,
            member_profiles_module_1.MemberProfilesModule,
            identity_verification_module_1.IdentityVerificationModule,
            locations_module_1.LocationsModule,
            insurance_module_1.InsuranceModule,
            members_module_1.MembersModule,
            payments_module_1.PaymentsModule,
            loans_module_1.LoansModule,
            loan_workflow_module_1.LoanWorkflowModule,
            notifications_module_1.NotificationsModule,
            chat_module_1.ChatModule,
            support_module_1.SupportModule,
            service_placeholders_module_1.ServicePlaceholdersModule,
            savings_module_1.SavingsModule,
            shareholders_module_1.ShareholdersModule,
            staff_module_1.StaffModule,
            voting_module_1.VotingModule,
            staff_activity_module_1.StaffActivityModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map