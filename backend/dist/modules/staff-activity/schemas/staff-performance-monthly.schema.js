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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffPerformanceMonthlySchema = exports.StaffPerformanceMonthly = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let StaffPerformanceMonthly = class StaffPerformanceMonthly {
};
exports.StaffPerformanceMonthly = StaffPerformanceMonthly;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceMonthly.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceMonthly.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceMonthly.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], StaffPerformanceMonthly.prototype, "periodStart", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "customersHelped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "membersServed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "transactionsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "loansHandled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "loanApplicationsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "loanApprovedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "loanRejectedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "loansEscalated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "kycCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "supportResolved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "tasksCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "avgHandlingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "responseTimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "pendingTasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "schoolPaymentsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "totalTransactionAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceMonthly.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['excellent', 'good', 'watch', 'needs_support'],
        default: 'good',
        index: true,
    }),
    __metadata("design:type", String)
], StaffPerformanceMonthly.prototype, "status", void 0);
exports.StaffPerformanceMonthly = StaffPerformanceMonthly = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'staff_performance_monthly',
        timestamps: true,
        versionKey: false,
    })
], StaffPerformanceMonthly);
exports.StaffPerformanceMonthlySchema = mongoose_1.SchemaFactory.createForClass(StaffPerformanceMonthly);
exports.StaffPerformanceMonthlySchema.index({ staffId: 1, periodStart: 1 }, { unique: true });
//# sourceMappingURL=staff-performance-monthly.schema.js.map