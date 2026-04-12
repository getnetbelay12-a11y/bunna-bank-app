"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const auth_module_1 = require("../auth/auth.module");
const chat_conversation_schema_1 = require("../chat/schemas/chat-conversation.schema");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const member_profile_schema_1 = require("../member-profiles/schemas/member-profile.schema");
const notification_campaign_schema_1 = require("../notifications/schemas/notification-campaign.schema");
const savings_account_schema_1 = require("../savings/schemas/savings-account.schema");
const autopay_setting_schema_1 = require("../service-placeholders/schemas/autopay-setting.schema");
const staff_schema_1 = require("../staff/schemas/staff.schema");
const branch_performance_daily_schema_1 = require("../staff-activity/schemas/branch-performance-daily.schema");
const district_performance_daily_schema_1 = require("../staff-activity/schemas/district-performance-daily.schema");
const school_payment_schema_1 = require("../payments/schemas/school-payment.schema");
const staff_performance_daily_schema_1 = require("../staff-activity/schemas/staff-performance-daily.schema");
const staff_performance_monthly_schema_1 = require("../staff-activity/schemas/staff-performance-monthly.schema");
const staff_performance_weekly_schema_1 = require("../staff-activity/schemas/staff-performance-weekly.schema");
const staff_performance_yearly_schema_1 = require("../staff-activity/schemas/staff-performance-yearly.schema");
const vote_response_schema_1 = require("../voting/schemas/vote-response.schema");
const vote_schema_1 = require("../voting/schemas/vote.schema");
const onboarding_evidence_schema_1 = require("../auth/schemas/onboarding-evidence.schema");
const uploads_module_1 = require("../uploads/uploads.module");
const command_center_controller_1 = require("./command-center.controller");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const manager_performance_controller_1 = require("./manager-performance.controller");
const manager_performance_service_1 = require("./manager-performance.service");
const performance_service_1 = require("./performance.service");
const risk_service_1 = require("./risk.service");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            uploads_module_1.UploadsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: loan_schema_1.Loan.name, schema: loan_schema_1.LoanSchema },
                { name: branch_schema_1.Branch.name, schema: branch_schema_1.BranchSchema },
                { name: district_schema_1.District.name, schema: district_schema_1.DistrictSchema },
                { name: school_payment_schema_1.SchoolPayment.name, schema: school_payment_schema_1.SchoolPaymentSchema },
                { name: staff_schema_1.Staff.name, schema: staff_schema_1.StaffSchema },
                { name: branch_performance_daily_schema_1.BranchPerformanceDaily.name, schema: branch_performance_daily_schema_1.BranchPerformanceDailySchema },
                { name: district_performance_daily_schema_1.DistrictPerformanceDaily.name, schema: district_performance_daily_schema_1.DistrictPerformanceDailySchema },
                { name: staff_performance_daily_schema_1.StaffPerformanceDaily.name, schema: staff_performance_daily_schema_1.StaffPerformanceDailySchema },
                { name: staff_performance_weekly_schema_1.StaffPerformanceWeekly.name, schema: staff_performance_weekly_schema_1.StaffPerformanceWeeklySchema },
                { name: staff_performance_monthly_schema_1.StaffPerformanceMonthly.name, schema: staff_performance_monthly_schema_1.StaffPerformanceMonthlySchema },
                { name: staff_performance_yearly_schema_1.StaffPerformanceYearly.name, schema: staff_performance_yearly_schema_1.StaffPerformanceYearlySchema },
                { name: vote_schema_1.Vote.name, schema: vote_schema_1.VoteSchema },
                { name: vote_response_schema_1.VoteResponse.name, schema: vote_response_schema_1.VoteResponseSchema },
                { name: member_schema_1.Member.name, schema: member_schema_1.MemberSchema },
                { name: member_profile_schema_1.MemberProfileEntity.name, schema: member_profile_schema_1.MemberProfileSchema },
                { name: onboarding_evidence_schema_1.OnboardingEvidence.name, schema: onboarding_evidence_schema_1.OnboardingEvidenceSchema },
                { name: savings_account_schema_1.SavingsAccount.name, schema: savings_account_schema_1.SavingsAccountSchema },
                { name: chat_conversation_schema_1.ChatConversation.name, schema: chat_conversation_schema_1.ChatConversationSchema },
                { name: notification_campaign_schema_1.NotificationCampaign.name, schema: notification_campaign_schema_1.NotificationCampaignSchema },
                { name: autopay_setting_schema_1.AutopaySetting.name, schema: autopay_setting_schema_1.AutopaySettingSchema },
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController, manager_performance_controller_1.ManagerPerformanceController, command_center_controller_1.CommandCenterController],
        providers: [dashboard_service_1.DashboardService, manager_performance_service_1.ManagerPerformanceService, performance_service_1.PerformanceService, risk_service_1.RiskService],
        exports: [dashboard_service_1.DashboardService, manager_performance_service_1.ManagerPerformanceService, performance_service_1.PerformanceService, risk_service_1.RiskService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map