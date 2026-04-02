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
exports.ManagerPerformanceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const branch_schema_1 = require("../members/schemas/branch.schema");
const district_schema_1 = require("../members/schemas/district.schema");
const staff_schema_1 = require("../staff/schemas/staff.schema");
const branch_performance_daily_schema_1 = require("../staff-activity/schemas/branch-performance-daily.schema");
const district_performance_daily_schema_1 = require("../staff-activity/schemas/district-performance-daily.schema");
const staff_performance_daily_schema_1 = require("../staff-activity/schemas/staff-performance-daily.schema");
const staff_performance_monthly_schema_1 = require("../staff-activity/schemas/staff-performance-monthly.schema");
const staff_performance_weekly_schema_1 = require("../staff-activity/schemas/staff-performance-weekly.schema");
const staff_performance_yearly_schema_1 = require("../staff-activity/schemas/staff-performance-yearly.schema");
const dto_1 = require("./dto");
let ManagerPerformanceService = class ManagerPerformanceService {
    constructor(branchPerformanceDailyModel, districtPerformanceDailyModel, staffPerformanceDailyModel, staffPerformanceWeeklyModel, staffPerformanceMonthlyModel, staffPerformanceYearlyModel, branchModel, districtModel, staffModel) {
        this.branchPerformanceDailyModel = branchPerformanceDailyModel;
        this.districtPerformanceDailyModel = districtPerformanceDailyModel;
        this.staffPerformanceDailyModel = staffPerformanceDailyModel;
        this.staffPerformanceWeeklyModel = staffPerformanceWeeklyModel;
        this.staffPerformanceMonthlyModel = staffPerformanceMonthlyModel;
        this.staffPerformanceYearlyModel = staffPerformanceYearlyModel;
        this.branchModel = branchModel;
        this.districtModel = districtModel;
        this.staffModel = staffModel;
    }
    async getHeadOfficeDistrictSummary(currentUser, query) {
        this.ensureHeadOfficeAccess(currentUser);
        const items = await this.loadDistrictItems(query);
        return this.buildOverview('district', query, items);
    }
    async getHeadOfficeTopDistricts(currentUser, query) {
        this.ensureHeadOfficeAccess(currentUser);
        const items = await this.loadDistrictItems(query);
        return this.pickTop(items);
    }
    async getHeadOfficeDistrictWatchlist(currentUser, query) {
        this.ensureHeadOfficeAccess(currentUser);
        const items = await this.loadDistrictItems(query);
        return this.pickWatchlist(items);
    }
    async getDistrictBranchSummary(currentUser, query) {
        this.ensureDistrictAccess(currentUser);
        const items = await this.loadBranchItems(currentUser, query);
        return this.buildOverview('branch', query, items);
    }
    async getDistrictTopBranches(currentUser, query) {
        this.ensureDistrictAccess(currentUser);
        const items = await this.loadBranchItems(currentUser, query);
        return this.pickTop(items);
    }
    async getDistrictBranchWatchlist(currentUser, query) {
        this.ensureDistrictAccess(currentUser);
        const items = await this.loadBranchItems(currentUser, query);
        return this.pickWatchlist(items);
    }
    async getBranchEmployeeSummary(currentUser, query) {
        this.ensureBranchAccess(currentUser);
        const items = await this.loadEmployeeItems(currentUser, query);
        return this.buildOverview('employee', query, items);
    }
    async getBranchTopEmployees(currentUser, query) {
        this.ensureBranchAccess(currentUser);
        const items = await this.loadEmployeeItems(currentUser, query);
        return this.pickTop(items);
    }
    async getBranchEmployeeWatchlist(currentUser, query) {
        this.ensureBranchAccess(currentUser);
        const items = await this.loadEmployeeItems(currentUser, query);
        return this.pickWatchlist(items);
    }
    async loadDistrictItems(query) {
        const { start, end } = this.resolveDateRange(query);
        const items = await this.districtPerformanceDailyModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: start,
                        $lt: end,
                    },
                },
            },
            ...this.groupDailyMetrics('$districtId', '$districtName'),
        ]);
        const districtNames = await this.loadDistrictNames(items.map((item) => item.districtId));
        return items.map((item) => this.toPerformanceEntity({
            entityId: item.districtId.toString(),
            entityType: 'district',
            name: item.districtName ??
                districtNames.get(item.districtId.toString()) ??
                'District',
            districtId: item.districtId.toString(),
            metrics: item,
        }));
    }
    async loadBranchItems(currentUser, query) {
        const { start, end } = this.resolveDateRange(query);
        const match = {
            date: {
                $gte: start,
                $lt: end,
            },
        };
        if (currentUser.districtId) {
            match.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const items = await this.branchPerformanceDailyModel.aggregate([
            { $match: match },
            ...this.groupDailyMetrics('$branchId', '$branchName', {
                districtId: '$districtId',
                districtName: '$districtName',
            }),
        ]);
        const [branchNames, districtNames] = await Promise.all([
            this.loadBranchNames(items.map((item) => item.branchId)),
            this.loadDistrictNames(items.map((item) => item.districtId)),
        ]);
        return items.map((item) => this.toPerformanceEntity({
            entityId: item.branchId.toString(),
            entityType: 'branch',
            name: item.branchName ?? branchNames.get(item.branchId.toString()) ?? 'Branch',
            branchId: item.branchId.toString(),
            branchName: item.branchName ?? branchNames.get(item.branchId.toString()) ?? 'Branch',
            districtId: item.districtId.toString(),
            districtName: item.districtName ??
                districtNames.get(item.districtId.toString()) ??
                'District',
            metrics: item,
        }));
    }
    async loadEmployeeItems(currentUser, query) {
        const model = this.resolveStaffModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        const periodStart = this.resolvePeriodStart(query.period ?? dto_1.DashboardPeriod.TODAY, query.date ? new Date(query.date) : new Date());
        const match = {
            periodStart,
        };
        if (currentUser.branchId) {
            match.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        const items = await model
            .find(match)
            .sort({ score: -1, customersHelped: -1 })
            .lean();
        const staffIds = items.map((item) => item.staffId);
        const staffMap = await this.loadStaffMap(staffIds);
        return items.map((item) => {
            const staff = staffMap.get(item.staffId.toString());
            return this.toPerformanceEntity({
                entityId: item.staffId.toString(),
                entityType: 'employee',
                name: staff?.fullName ?? 'Employee',
                branchId: item.branchId.toString(),
                branchName: currentUser.branchName,
                districtId: item.districtId.toString(),
                districtName: currentUser.districtName,
                role: staff?.role,
                metrics: {
                    membersServed: item.membersServed ?? item.customersHelped ?? 0,
                    customersHelped: item.customersHelped ?? 0,
                    loansHandled: item.loansHandled ?? item.loanApplicationsCount ?? 0,
                    loansApproved: item.loanApprovedCount ?? 0,
                    loansEscalated: item.loansEscalated ?? 0,
                    kycCompleted: item.kycCompleted ?? 0,
                    supportResolved: item.supportResolved ?? 0,
                    transactionsProcessed: item.transactionsCount ?? 0,
                    avgHandlingTime: item.avgHandlingTime ?? 0,
                    pendingTasks: item.pendingTasks ?? 0,
                    pendingApprovals: item.loanApplicationsCount ?? 0,
                    responseTimeMinutes: item.responseTimeMinutes ?? 0,
                    score: item.score ?? 0,
                },
            });
        });
    }
    groupDailyMetrics(idExpression, nameExpression, extraIdFields = {}) {
        return [
            {
                $group: {
                    _id: {
                        entityId: idExpression,
                        entityName: nameExpression,
                        ...extraIdFields,
                    },
                    membersServed: { $sum: '$membersServed' },
                    customersHelped: { $sum: '$customersHelped' },
                    loansHandled: { $sum: '$loansHandled' },
                    loansApproved: { $sum: '$loansApproved' },
                    loansEscalated: { $sum: '$loansEscalated' },
                    kycCompleted: { $sum: '$kycCompleted' },
                    supportResolved: { $sum: '$supportResolved' },
                    transactionsProcessed: { $sum: '$transactionsProcessed' },
                    avgHandlingTime: { $avg: '$avgHandlingTime' },
                    pendingTasks: { $avg: '$pendingTasks' },
                    pendingApprovals: { $avg: '$pendingApprovals' },
                    responseTimeMinutes: { $avg: '$responseTimeMinutes' },
                    score: { $avg: '$score' },
                },
            },
            {
                $project: {
                    _id: 0,
                    districtId: '$_id.districtId',
                    districtName: '$_id.districtName',
                    branchId: '$_id.entityId',
                    branchName: '$_id.entityName',
                    membersServed: 1,
                    customersHelped: 1,
                    loansHandled: 1,
                    loansApproved: 1,
                    loansEscalated: 1,
                    kycCompleted: 1,
                    supportResolved: 1,
                    transactionsProcessed: 1,
                    avgHandlingTime: { $round: ['$avgHandlingTime', 1] },
                    pendingTasks: { $round: ['$pendingTasks', 0] },
                    pendingApprovals: { $round: ['$pendingApprovals', 0] },
                    responseTimeMinutes: { $round: ['$responseTimeMinutes', 1] },
                    score: { $round: ['$score', 1] },
                },
            },
            {
                $addFields: {
                    districtId: {
                        $ifNull: ['$districtId', '$branchId'],
                    },
                    districtName: {
                        $ifNull: ['$districtName', '$branchName'],
                    },
                },
            },
        ];
    }
    buildOverview(scope, query, items) {
        return {
            scope,
            period: (query.period ?? dto_1.DashboardPeriod.TODAY),
            generatedAt: new Date().toISOString(),
            kpis: this.summarizeKpis(items),
            items: items.sort((left, right) => right.score - left.score),
        };
    }
    summarizeKpis(items) {
        if (items.length === 0) {
            return {
                membersServed: 0,
                customersHelped: 0,
                loansHandled: 0,
                loansApproved: 0,
                loansEscalated: 0,
                kycCompleted: 0,
                supportResolved: 0,
                transactionsProcessed: 0,
                avgHandlingTime: 0,
                pendingTasks: 0,
                pendingApprovals: 0,
                responseTimeMinutes: 0,
                score: 0,
                status: 'good',
            };
        }
        const aggregate = items.reduce((accumulator, item) => ({
            membersServed: accumulator.membersServed + item.membersServed,
            customersHelped: accumulator.customersHelped + item.customersHelped,
            loansHandled: accumulator.loansHandled + item.loansHandled,
            loansApproved: accumulator.loansApproved + item.loansApproved,
            loansEscalated: accumulator.loansEscalated + item.loansEscalated,
            kycCompleted: accumulator.kycCompleted + item.kycCompleted,
            supportResolved: accumulator.supportResolved + item.supportResolved,
            transactionsProcessed: accumulator.transactionsProcessed + item.transactionsProcessed,
            avgHandlingTime: accumulator.avgHandlingTime + item.avgHandlingTime,
            pendingTasks: accumulator.pendingTasks + item.pendingTasks,
            pendingApprovals: accumulator.pendingApprovals + item.pendingApprovals,
            responseTimeMinutes: accumulator.responseTimeMinutes + item.responseTimeMinutes,
            score: accumulator.score + item.score,
        }), {
            membersServed: 0,
            customersHelped: 0,
            loansHandled: 0,
            loansApproved: 0,
            loansEscalated: 0,
            kycCompleted: 0,
            supportResolved: 0,
            transactionsProcessed: 0,
            avgHandlingTime: 0,
            pendingTasks: 0,
            pendingApprovals: 0,
            responseTimeMinutes: 0,
            score: 0,
        });
        const divisor = items.length;
        const normalizedScore = Number((aggregate.score / divisor).toFixed(1));
        return {
            ...aggregate,
            avgHandlingTime: Number((aggregate.avgHandlingTime / divisor).toFixed(1)),
            pendingTasks: Number((aggregate.pendingTasks / divisor).toFixed(0)),
            pendingApprovals: Number((aggregate.pendingApprovals / divisor).toFixed(0)),
            responseTimeMinutes: Number((aggregate.responseTimeMinutes / divisor).toFixed(1)),
            score: normalizedScore,
            status: this.resolveStatus(normalizedScore),
        };
    }
    pickTop(items) {
        return [...items].sort((left, right) => right.score - left.score).slice(0, 5);
    }
    pickWatchlist(items) {
        const flagged = items
            .filter((item) => ['watch', 'needs_support'].includes(item.status))
            .sort((left, right) => left.score - right.score);
        if (flagged.length > 0) {
            return flagged.slice(0, 5);
        }
        return [...items].sort((left, right) => left.score - right.score).slice(0, 5);
    }
    toPerformanceEntity(input) {
        const score = Number((input.metrics.score ?? 0).toFixed(1));
        return {
            entityId: input.entityId,
            entityType: input.entityType,
            name: input.name,
            districtId: input.districtId,
            districtName: input.districtName,
            branchId: input.branchId,
            branchName: input.branchName,
            role: input.role,
            membersServed: input.metrics.membersServed,
            customersHelped: input.metrics.customersHelped,
            loansHandled: input.metrics.loansHandled,
            loansApproved: input.metrics.loansApproved,
            loansEscalated: input.metrics.loansEscalated,
            kycCompleted: input.metrics.kycCompleted,
            supportResolved: input.metrics.supportResolved,
            transactionsProcessed: input.metrics.transactionsProcessed,
            avgHandlingTime: Number((input.metrics.avgHandlingTime ?? 0).toFixed(1)),
            pendingTasks: Math.round(input.metrics.pendingTasks ?? 0),
            pendingApprovals: Math.round(input.metrics.pendingApprovals ?? 0),
            responseTimeMinutes: Number((input.metrics.responseTimeMinutes ?? 0).toFixed(1)),
            score,
            status: this.resolveStatus(score),
        };
    }
    resolveStatus(score) {
        if (score >= 88) {
            return 'excellent';
        }
        if (score >= 72) {
            return 'good';
        }
        if (score >= 58) {
            return 'watch';
        }
        return 'needs_support';
    }
    async loadBranchNames(branchIds) {
        const branches = await this.branchModel
            .find({ _id: { $in: this.uniqueObjectIds(branchIds) } })
            .select('_id name')
            .lean();
        return new Map(branches.map((item) => [item._id.toString(), item.name]));
    }
    async loadDistrictNames(districtIds) {
        const districts = await this.districtModel
            .find({ _id: { $in: this.uniqueObjectIds(districtIds) } })
            .select('_id name')
            .lean();
        return new Map(districts.map((item) => [item._id.toString(), item.name]));
    }
    async loadStaffMap(staffIds) {
        const staff = await this.staffModel
            .find({ _id: { $in: this.uniqueObjectIds(staffIds) } })
            .select('_id fullName role')
            .lean();
        return new Map(staff.map((item) => [item._id.toString(), item]));
    }
    uniqueObjectIds(values) {
        return [...new Map(values.map((value) => [value.toString(), value])).values()];
    }
    resolveStaffModel(period) {
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return this.staffPerformanceDailyModel;
            case dto_1.DashboardPeriod.WEEK:
                return this.staffPerformanceWeeklyModel;
            case dto_1.DashboardPeriod.MONTH:
                return this.staffPerformanceMonthlyModel;
            case dto_1.DashboardPeriod.YEAR:
                return this.staffPerformanceYearlyModel;
        }
    }
    resolveDateRange(query) {
        const period = query.period ?? dto_1.DashboardPeriod.TODAY;
        const start = this.resolvePeriodStart(period, query.date ? new Date(query.date) : new Date());
        const end = new Date(start);
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                end.setDate(end.getDate() + 1);
                break;
            case dto_1.DashboardPeriod.WEEK:
                end.setDate(end.getDate() + 7);
                break;
            case dto_1.DashboardPeriod.MONTH:
                end.setMonth(end.getMonth() + 1);
                break;
            case dto_1.DashboardPeriod.YEAR:
                end.setFullYear(end.getFullYear() + 1);
                break;
        }
        return { start, end };
    }
    resolvePeriodStart(period, date) {
        const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return base;
            case dto_1.DashboardPeriod.WEEK: {
                const day = base.getUTCDay();
                const diff = day === 0 ? -6 : 1 - day;
                base.setUTCDate(base.getUTCDate() + diff);
                return base;
            }
            case dto_1.DashboardPeriod.MONTH:
                base.setUTCDate(1);
                return base;
            case dto_1.DashboardPeriod.YEAR:
                base.setUTCMonth(0, 1);
                return base;
        }
    }
    ensureHeadOfficeAccess(currentUser) {
        if (![
            enums_1.UserRole.HEAD_OFFICE_MANAGER,
            enums_1.UserRole.HEAD_OFFICE_OFFICER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only head office roles can access district performance.');
        }
    }
    ensureDistrictAccess(currentUser) {
        if (![
            enums_1.UserRole.DISTRICT_MANAGER,
            enums_1.UserRole.DISTRICT_OFFICER,
            enums_1.UserRole.ADMIN,
        ].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only district roles can access branch performance.');
        }
    }
    ensureBranchAccess(currentUser) {
        if (![enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.ADMIN].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('Only branch managers can access employee performance.');
        }
    }
};
exports.ManagerPerformanceService = ManagerPerformanceService;
exports.ManagerPerformanceService = ManagerPerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(branch_performance_daily_schema_1.BranchPerformanceDaily.name)),
    __param(1, (0, mongoose_1.InjectModel)(district_performance_daily_schema_1.DistrictPerformanceDaily.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_performance_daily_schema_1.StaffPerformanceDaily.name)),
    __param(3, (0, mongoose_1.InjectModel)(staff_performance_weekly_schema_1.StaffPerformanceWeekly.name)),
    __param(4, (0, mongoose_1.InjectModel)(staff_performance_monthly_schema_1.StaffPerformanceMonthly.name)),
    __param(5, (0, mongoose_1.InjectModel)(staff_performance_yearly_schema_1.StaffPerformanceYearly.name)),
    __param(6, (0, mongoose_1.InjectModel)(branch_schema_1.Branch.name)),
    __param(7, (0, mongoose_1.InjectModel)(district_schema_1.District.name)),
    __param(8, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ManagerPerformanceService);
//# sourceMappingURL=manager-performance.service.js.map