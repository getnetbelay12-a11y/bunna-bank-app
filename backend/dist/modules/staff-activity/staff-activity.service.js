"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffActivityService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const dto_1 = require("./dto");
const staff_activity_log_schema_1 = require("./schemas/staff-activity-log.schema");
const staff_performance_daily_schema_1 = require("./schemas/staff-performance-daily.schema");
const staff_performance_monthly_schema_1 = require("./schemas/staff-performance-monthly.schema");
const staff_performance_weekly_schema_1 = require("./schemas/staff-performance-weekly.schema");
const staff_performance_yearly_schema_1 = require("./schemas/staff-performance-yearly.schema");
let StaffActivityService = class StaffActivityService {
    constructor(staffActivityLogModel, dailyModel, weeklyModel, monthlyModel, yearlyModel) {
        this.staffActivityLogModel = staffActivityLogModel;
        this.dailyModel = dailyModel;
        this.weeklyModel = weeklyModel;
        this.monthlyModel = monthlyModel;
        this.yearlyModel = yearlyModel;
    }
    async recordActivity(dto) {
        const activity = await this.staffActivityLogModel.create({
            staffId: new mongoose_2.Types.ObjectId(dto.staffId),
            memberId: dto.memberId ? new mongoose_2.Types.ObjectId(dto.memberId) : undefined,
            branchId: new mongoose_2.Types.ObjectId(dto.branchId),
            districtId: new mongoose_2.Types.ObjectId(dto.districtId),
            activityType: dto.activityType,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId ? new mongoose_2.Types.ObjectId(dto.referenceId) : undefined,
            amount: dto.amount ?? 0,
            createdAt: dto.createdAt,
            updatedAt: dto.createdAt,
        });
        return {
            id: activity._id.toString(),
            activityType: activity.activityType,
        };
    }
    async buildSummary(currentUser, query) {
        this.ensureManagerAccess(currentUser);
        const targetDate = query.date ? new Date(query.date) : new Date();
        const periodStart = this.resolvePeriodStart(query.period, targetDate);
        const periodEnd = this.resolvePeriodEnd(query.period, targetDate);
        const match = {
            createdAt: {
                $gte: periodStart,
                $lt: periodEnd,
            },
        };
        if (query.staffId) {
            match.staffId = new mongoose_2.Types.ObjectId(query.staffId);
        }
        if (query.branchId) {
            match.branchId = new mongoose_2.Types.ObjectId(query.branchId);
        }
        else if (currentUser.branchId && currentUser.role === enums_1.UserRole.BRANCH_MANAGER) {
            match.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if (query.districtId) {
            match.districtId = new mongoose_2.Types.ObjectId(query.districtId);
        }
        else if (currentUser.districtId &&
            (currentUser.role === enums_1.UserRole.DISTRICT_MANAGER ||
                currentUser.role === enums_1.UserRole.DISTRICT_OFFICER)) {
            match.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: {
                        staffId: '$staffId',
                        branchId: '$branchId',
                        districtId: '$districtId',
                    },
                    customersHelped: {
                        $sum: {
                            $cond: [{ $eq: ['$activityType', enums_1.ActivityType.CUSTOMER_HELPED] }, 1, 0],
                        },
                    },
                    transactionsCount: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        '$activityType',
                                        [
                                            enums_1.ActivityType.DEPOSIT,
                                            enums_1.ActivityType.WITHDRAWAL,
                                            enums_1.ActivityType.TRANSFER,
                                            enums_1.ActivityType.SCHOOL_PAYMENT,
                                        ],
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    loanApplicationsCount: {
                        $sum: {
                            $cond: [{ $eq: ['$activityType', enums_1.ActivityType.LOAN_CREATED] }, 1, 0],
                        },
                    },
                    loanApprovedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$activityType', enums_1.ActivityType.LOAN_APPROVED] }, 1, 0],
                        },
                    },
                    loanRejectedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$activityType', enums_1.ActivityType.LOAN_REJECTED] }, 1, 0],
                        },
                    },
                    schoolPaymentsCount: {
                        $sum: {
                            $cond: [{ $eq: ['$activityType', enums_1.ActivityType.SCHOOL_PAYMENT] }, 1, 0],
                        },
                    },
                    totalTransactionAmount: { $sum: '$amount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    staffId: '$_id.staffId',
                    branchId: '$_id.branchId',
                    districtId: '$_id.districtId',
                    periodStart: { $literal: periodStart },
                    customersHelped: 1,
                    transactionsCount: 1,
                    loanApplicationsCount: 1,
                    loanApprovedCount: 1,
                    loanRejectedCount: 1,
                    schoolPaymentsCount: 1,
                    totalTransactionAmount: 1,
                },
            },
        ];
        const summary = await this.staffActivityLogModel.aggregate(pipeline);
        await this.persistSummary(query.period, summary);
        return summary.map((item) => ({
            ...item,
            staffId: item.staffId.toString(),
            branchId: item.branchId.toString(),
            districtId: item.districtId.toString(),
        }));
    }
    async persistSummary(period, records) {
        const model = this.resolvePerformanceModel(period);
        await Promise.all(records.map((record) => model.findOneAndUpdate({
            staffId: new mongoose_2.Types.ObjectId(record.staffId),
            periodStart: record.periodStart,
        }, {
            $set: {
                staffId: new mongoose_2.Types.ObjectId(record.staffId),
                branchId: new mongoose_2.Types.ObjectId(record.branchId),
                districtId: new mongoose_2.Types.ObjectId(record.districtId),
                periodStart: record.periodStart,
                customersHelped: record.customersHelped,
                transactionsCount: record.transactionsCount,
                loanApplicationsCount: record.loanApplicationsCount,
                loanApprovedCount: record.loanApprovedCount,
                loanRejectedCount: record.loanRejectedCount,
                schoolPaymentsCount: record.schoolPaymentsCount,
                totalTransactionAmount: record.totalTransactionAmount,
            },
        }, { upsert: true, new: true })));
    }
    resolvePerformanceModel(period) {
        switch (period) {
            case dto_1.StaffPerformancePeriod.DAILY:
                return this.dailyModel;
            case dto_1.StaffPerformancePeriod.WEEKLY:
                return this.weeklyModel;
            case dto_1.StaffPerformancePeriod.MONTHLY:
                return this.monthlyModel;
            case dto_1.StaffPerformancePeriod.YEARLY:
                return this.yearlyModel;
        }
    }
    resolvePeriodStart(period, date) {
        const base = new Date(date);
        base.setHours(0, 0, 0, 0);
        switch (period) {
            case dto_1.StaffPerformancePeriod.DAILY:
                return base;
            case dto_1.StaffPerformancePeriod.WEEKLY: {
                const day = base.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                base.setDate(base.getDate() + diff);
                return base;
            }
            case dto_1.StaffPerformancePeriod.MONTHLY:
                base.setDate(1);
                return base;
            case dto_1.StaffPerformancePeriod.YEARLY:
                base.setMonth(0, 1);
                return base;
        }
    }
    resolvePeriodEnd(period, date) {
        const start = this.resolvePeriodStart(period, date);
        const end = new Date(start);
        switch (period) {
            case dto_1.StaffPerformancePeriod.DAILY:
                end.setDate(end.getDate() + 1);
                break;
            case dto_1.StaffPerformancePeriod.WEEKLY:
                end.setDate(end.getDate() + 7);
                break;
            case dto_1.StaffPerformancePeriod.MONTHLY:
                end.setMonth(end.getMonth() + 1);
                break;
            case dto_1.StaffPerformancePeriod.YEARLY:
                end.setFullYear(end.getFullYear() + 1);
                break;
        }
        return end;
    }
    ensureManagerAccess(currentUser) {
        if (![
            enums_1.UserRole.BRANCH_MANAGER,
            enums_1.UserRole.DISTRICT_OFFICER,
            enums_1.UserRole.DISTRICT_MANAGER,
            enums_1.UserRole.HEAD_OFFICE_OFFICER,
            enums_1.UserRole.HEAD_OFFICE_MANAGER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only manager and admin roles can view staff performance.');
        }
    }
};
exports.StaffActivityService = StaffActivityService;
exports.StaffActivityService = StaffActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_activity_log_schema_1.StaffActivityLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(staff_performance_daily_schema_1.StaffPerformanceDaily.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_performance_weekly_schema_1.StaffPerformanceWeekly.name)),
    __param(3, (0, mongoose_1.InjectModel)(staff_performance_monthly_schema_1.StaffPerformanceMonthly.name)),
    __param(4, (0, mongoose_1.InjectModel)(staff_performance_yearly_schema_1.StaffPerformanceYearly.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], StaffActivityService);
//# sourceMappingURL=staff-activity.service.js.map