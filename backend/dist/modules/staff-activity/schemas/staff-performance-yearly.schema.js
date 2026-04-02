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
exports.StaffPerformanceYearlySchema = exports.StaffPerformanceYearly = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let StaffPerformanceYearly = class StaffPerformanceYearly {
};
exports.StaffPerformanceYearly = StaffPerformanceYearly;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceYearly.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceYearly.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceYearly.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], StaffPerformanceYearly.prototype, "periodStart", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "customersHelped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "membersServed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "transactionsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "loansHandled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "loanApplicationsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "loanApprovedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "loanRejectedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "loansEscalated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "kycCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "supportResolved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "tasksCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "avgHandlingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "responseTimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "pendingTasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "schoolPaymentsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "totalTransactionAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceYearly.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['excellent', 'good', 'watch', 'needs_support'],
        default: 'good',
        index: true,
    }),
    __metadata("design:type", String)
], StaffPerformanceYearly.prototype, "status", void 0);
exports.StaffPerformanceYearly = StaffPerformanceYearly = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'staff_performance_yearly',
        timestamps: true,
        versionKey: false,
    })
], StaffPerformanceYearly);
exports.StaffPerformanceYearlySchema = mongoose_1.SchemaFactory.createForClass(StaffPerformanceYearly);
exports.StaffPerformanceYearlySchema.index({ staffId: 1, periodStart: 1 }, { unique: true });
//# sourceMappingURL=staff-performance-yearly.schema.js.map