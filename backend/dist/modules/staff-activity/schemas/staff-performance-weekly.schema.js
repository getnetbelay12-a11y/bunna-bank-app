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
exports.StaffPerformanceWeeklySchema = exports.StaffPerformanceWeekly = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let StaffPerformanceWeekly = class StaffPerformanceWeekly {
};
exports.StaffPerformanceWeekly = StaffPerformanceWeekly;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceWeekly.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceWeekly.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffPerformanceWeekly.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], StaffPerformanceWeekly.prototype, "periodStart", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "customersHelped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "membersServed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "transactionsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "loansHandled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "loanApplicationsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "loanApprovedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "loanRejectedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "loansEscalated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "kycCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "supportResolved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "tasksCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "avgHandlingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "responseTimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "pendingTasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "schoolPaymentsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "totalTransactionAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], StaffPerformanceWeekly.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['excellent', 'good', 'watch', 'needs_support'],
        default: 'good',
        index: true,
    }),
    __metadata("design:type", String)
], StaffPerformanceWeekly.prototype, "status", void 0);
exports.StaffPerformanceWeekly = StaffPerformanceWeekly = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'staff_performance_weekly',
        timestamps: true,
        versionKey: false,
    })
], StaffPerformanceWeekly);
exports.StaffPerformanceWeeklySchema = mongoose_1.SchemaFactory.createForClass(StaffPerformanceWeekly);
exports.StaffPerformanceWeeklySchema.index({ staffId: 1, periodStart: 1 }, { unique: true });
//# sourceMappingURL=staff-performance-weekly.schema.js.map