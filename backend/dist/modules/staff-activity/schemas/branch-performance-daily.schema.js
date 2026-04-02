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
exports.BranchPerformanceDailySchema = exports.BranchPerformanceDaily = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let BranchPerformanceDaily = class BranchPerformanceDaily {
};
exports.BranchPerformanceDaily = BranchPerformanceDaily;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BranchPerformanceDaily.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BranchPerformanceDaily.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], BranchPerformanceDaily.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BranchPerformanceDaily.prototype, "districtName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], BranchPerformanceDaily.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "membersServed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "customersHelped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "loansHandled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "loansApproved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "loansEscalated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "kycCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "supportResolved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "transactionsProcessed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "avgHandlingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "pendingTasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "pendingApprovals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "responseTimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], BranchPerformanceDaily.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['excellent', 'good', 'watch', 'needs_support'],
        default: 'good',
        index: true,
    }),
    __metadata("design:type", String)
], BranchPerformanceDaily.prototype, "status", void 0);
exports.BranchPerformanceDaily = BranchPerformanceDaily = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'branch_performance_daily',
        timestamps: true,
        versionKey: false,
    })
], BranchPerformanceDaily);
exports.BranchPerformanceDailySchema = mongoose_1.SchemaFactory.createForClass(BranchPerformanceDaily);
exports.BranchPerformanceDailySchema.index({ branchId: 1, date: 1 }, { unique: true });
exports.BranchPerformanceDailySchema.index({ districtId: 1, date: 1 });
//# sourceMappingURL=branch-performance-daily.schema.js.map