"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffActivityModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const staff_activity_controller_1 = require("./staff-activity.controller");
const staff_activity_service_1 = require("./staff-activity.service");
const staff_activity_log_schema_1 = require("./schemas/staff-activity-log.schema");
const staff_performance_daily_schema_1 = require("./schemas/staff-performance-daily.schema");
const staff_performance_monthly_schema_1 = require("./schemas/staff-performance-monthly.schema");
const staff_performance_weekly_schema_1 = require("./schemas/staff-performance-weekly.schema");
const staff_performance_yearly_schema_1 = require("./schemas/staff-performance-yearly.schema");
let StaffActivityModule = class StaffActivityModule {
};
exports.StaffActivityModule = StaffActivityModule;
exports.StaffActivityModule = StaffActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: staff_activity_log_schema_1.StaffActivityLog.name, schema: staff_activity_log_schema_1.StaffActivityLogSchema },
                { name: staff_performance_daily_schema_1.StaffPerformanceDaily.name, schema: staff_performance_daily_schema_1.StaffPerformanceDailySchema },
                { name: staff_performance_weekly_schema_1.StaffPerformanceWeekly.name, schema: staff_performance_weekly_schema_1.StaffPerformanceWeeklySchema },
                { name: staff_performance_monthly_schema_1.StaffPerformanceMonthly.name, schema: staff_performance_monthly_schema_1.StaffPerformanceMonthlySchema },
                { name: staff_performance_yearly_schema_1.StaffPerformanceYearly.name, schema: staff_performance_yearly_schema_1.StaffPerformanceYearlySchema },
            ]),
        ],
        controllers: [staff_activity_controller_1.StaffActivityController],
        providers: [staff_activity_service_1.StaffActivityService],
        exports: [staff_activity_service_1.StaffActivityService],
    })
], StaffActivityModule);
//# sourceMappingURL=staff-activity.module.js.map