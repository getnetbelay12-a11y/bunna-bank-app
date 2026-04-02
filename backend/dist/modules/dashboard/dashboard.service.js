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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const dto_1 = require("./dto");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const school_payment_schema_1 = require("../payments/schemas/school-payment.schema");
const staff_performance_daily_schema_1 = require("../staff-activity/schemas/staff-performance-daily.schema");
const staff_performance_weekly_schema_1 = require("../staff-activity/schemas/staff-performance-weekly.schema");
const staff_performance_monthly_schema_1 = require("../staff-activity/schemas/staff-performance-monthly.schema");
const staff_performance_yearly_schema_1 = require("../staff-activity/schemas/staff-performance-yearly.schema");
const vote_schema_1 = require("../voting/schemas/vote.schema");
const vote_response_schema_1 = require("../voting/schemas/vote-response.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const enums_2 = require("../../common/enums");
let DashboardService = class DashboardService {
    constructor(loanModel, schoolPaymentModel, dailyPerformanceModel, weeklyPerformanceModel, monthlyPerformanceModel, yearlyPerformanceModel, voteModel, voteResponseModel, memberModel) {
        this.loanModel = loanModel;
        this.schoolPaymentModel = schoolPaymentModel;
        this.dailyPerformanceModel = dailyPerformanceModel;
        this.weeklyPerformanceModel = weeklyPerformanceModel;
        this.monthlyPerformanceModel = monthlyPerformanceModel;
        this.yearlyPerformanceModel = yearlyPerformanceModel;
        this.voteModel = voteModel;
        this.voteResponseModel = voteResponseModel;
        this.memberModel = memberModel;
    }
    async getSummary(currentUser, query) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        const [performance, schoolPayments, pendingLoans] = await Promise.all([
            performanceModel.aggregate([
                { $match: scope.performanceMatch },
                {
                    $group: {
                        _id: null,
                        customersServed: { $sum: '$customersHelped' },
                        transactionsCount: { $sum: '$transactionsCount' },
                    },
                },
                { $project: { _id: 0, customersServed: 1, transactionsCount: 1 } },
            ]),
            this.schoolPaymentModel.countDocuments(scope.collectionMatch),
            this.loanModel.aggregate([
                {
                    $match: {
                        ...scope.collectionMatch,
                        status: { $in: [enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW, enums_1.LoanStatus.DISTRICT_REVIEW, enums_1.LoanStatus.HEAD_OFFICE_REVIEW] },
                    },
                },
                {
                    $group: {
                        _id: '$currentLevel',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        level: '$_id',
                        count: 1,
                    },
                },
            ]),
        ]);
        return {
            customersServed: performance[0]?.customersServed ?? 0,
            transactionsCount: performance[0]?.transactionsCount ?? 0,
            schoolPaymentsCount: schoolPayments,
            pendingLoansByLevel: pendingLoans,
        };
    }
    async getBranchPerformance(currentUser, query) {
        return this.getPerformanceByScope(currentUser, query, 'branchId');
    }
    async getDistrictPerformance(currentUser, query) {
        return this.getPerformanceByScope(currentUser, query, 'districtId');
    }
    async getStaffRanking(currentUser, query) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        return performanceModel.aggregate([
            { $match: scope.performanceMatch },
            {
                $project: {
                    _id: 0,
                    staffId: { $toString: '$staffId' },
                    branchId: { $toString: '$branchId' },
                    districtId: { $toString: '$districtId' },
                    customersServed: '$customersHelped',
                    transactionsCount: 1,
                    loanApprovedCount: 1,
                    schoolPaymentsCount: 1,
                    score: {
                        $add: [
                            '$customersHelped',
                            '$transactionsCount',
                            { $multiply: ['$loanApprovedCount', 3] },
                            '$schoolPaymentsCount',
                        ],
                    },
                },
            },
            { $sort: { score: -1, loanApprovedCount: -1 } },
            { $limit: 10 },
        ]);
    }
    async getVotingSummary(currentUser) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildManagerScope(currentUser);
        const [votes, eligibleShareholders] = await Promise.all([
            this.voteModel.find({}).sort({ startDate: -1 }).lean(),
            this.memberModel.countDocuments({
                memberType: enums_2.MemberType.SHAREHOLDER,
                ...scope,
            }),
        ]);
        return Promise.all(votes.map(async (vote) => {
            const totalResponses = await this.voteResponseModel.countDocuments({
                voteId: vote._id,
                ...scope,
            });
            return {
                voteId: vote._id.toString(),
                title: vote.title,
                totalResponses,
                eligibleShareholders,
                participationRate: eligibleShareholders === 0
                    ? 0
                    : Number(((totalResponses / eligibleShareholders) * 100).toFixed(2)),
            };
        }));
    }
    async getPerformanceByScope(currentUser, query, field) {
        this.ensureManagerAccess(currentUser);
        const scope = this.buildScope(currentUser, query);
        const performanceModel = this.resolvePerformanceModel(query.period ?? dto_1.DashboardPeriod.TODAY);
        return performanceModel.aggregate([
            { $match: scope.performanceMatch },
            {
                $group: {
                    _id: `$${field}`,
                    customersServed: { $sum: '$customersHelped' },
                    transactionsCount: { $sum: '$transactionsCount' },
                    loanApprovedCount: { $sum: '$loanApprovedCount' },
                    loanRejectedCount: { $sum: '$loanRejectedCount' },
                    schoolPaymentsCount: { $sum: '$schoolPaymentsCount' },
                    totalTransactionAmount: { $sum: '$totalTransactionAmount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    scopeId: { $toString: '$_id' },
                    customersServed: 1,
                    transactionsCount: 1,
                    loanApprovedCount: 1,
                    loanRejectedCount: 1,
                    schoolPaymentsCount: 1,
                    totalTransactionAmount: 1,
                },
            },
            { $sort: { totalTransactionAmount: -1 } },
        ]);
    }
    buildScope(currentUser, query) {
        const periodStart = this.resolvePeriodStart(query.period ?? dto_1.DashboardPeriod.TODAY, query.date ? new Date(query.date) : new Date());
        const collectionMatch = {
            createdAt: { $gte: periodStart },
        };
        const performanceMatch = {
            periodStart,
        };
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            collectionMatch.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
            performanceMatch.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if ([enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
            currentUser.districtId) {
            collectionMatch.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
            performanceMatch.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        return { collectionMatch, performanceMatch };
    }
    buildManagerScope(currentUser) {
        const scope = {};
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER && currentUser.branchId) {
            scope.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if ([enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role) &&
            currentUser.districtId) {
            scope.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        return scope;
    }
    resolvePerformanceModel(period) {
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return this.dailyPerformanceModel;
            case dto_1.DashboardPeriod.WEEK:
                return this.weeklyPerformanceModel;
            case dto_1.DashboardPeriod.MONTH:
                return this.monthlyPerformanceModel;
            case dto_1.DashboardPeriod.YEAR:
                return this.yearlyPerformanceModel;
        }
    }
    resolvePeriodStart(period, date) {
        const base = new Date(date);
        base.setHours(0, 0, 0, 0);
        switch (period) {
            case dto_1.DashboardPeriod.TODAY:
                return base;
            case dto_1.DashboardPeriod.WEEK: {
                const day = base.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                base.setDate(base.getDate() + diff);
                return base;
            }
            case dto_1.DashboardPeriod.MONTH:
                base.setDate(1);
                return base;
            case dto_1.DashboardPeriod.YEAR:
                base.setMonth(0, 1);
                return base;
        }
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
            throw new common_1.ForbiddenException('Only manager and admin roles can access dashboard data.');
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(school_payment_schema_1.SchoolPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_performance_daily_schema_1.StaffPerformanceDaily.name)),
    __param(3, (0, mongoose_1.InjectModel)(staff_performance_weekly_schema_1.StaffPerformanceWeekly.name)),
    __param(4, (0, mongoose_1.InjectModel)(staff_performance_monthly_schema_1.StaffPerformanceMonthly.name)),
    __param(5, (0, mongoose_1.InjectModel)(staff_performance_yearly_schema_1.StaffPerformanceYearly.name)),
    __param(6, (0, mongoose_1.InjectModel)(vote_schema_1.Vote.name)),
    __param(7, (0, mongoose_1.InjectModel)(vote_response_schema_1.VoteResponse.name)),
    __param(8, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map