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
const loan_schema_1 = require("../loans/schemas/loan.schema");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const member_schema_1 = require("../members/schemas/member.schema");
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
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const manager_performance_controller_1 = require("./manager-performance.controller");
const manager_performance_service_1 = require("./manager-performance.service");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
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
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController, manager_performance_controller_1.ManagerPerformanceController],
        providers: [dashboard_service_1.DashboardService, manager_performance_service_1.ManagerPerformanceService],
        exports: [dashboard_service_1.DashboardService, manager_performance_service_1.ManagerPerformanceService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map