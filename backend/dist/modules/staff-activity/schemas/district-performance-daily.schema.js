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
exports.DistrictPerformanceDailySchema = exports.DistrictPerformanceDaily = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let DistrictPerformanceDaily = class DistrictPerformanceDaily {
};
exports.DistrictPerformanceDaily = DistrictPerformanceDaily;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], DistrictPerformanceDaily.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], DistrictPerformanceDaily.prototype, "districtName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Date)
], DistrictPerformanceDaily.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "membersServed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "customersHelped", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "loansHandled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "loansApproved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "loansEscalated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "kycCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "supportResolved", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "transactionsProcessed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "avgHandlingTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "pendingTasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "pendingApprovals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "responseTimeMinutes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], DistrictPerformanceDaily.prototype, "score", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['excellent', 'good', 'watch', 'needs_support'],
        default: 'good',
        index: true,
    }),
    __metadata("design:type", String)
], DistrictPerformanceDaily.prototype, "status", void 0);
exports.DistrictPerformanceDaily = DistrictPerformanceDaily = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'district_performance_daily',
        timestamps: true,
        versionKey: false,
    })
], DistrictPerformanceDaily);
exports.DistrictPerformanceDailySchema = mongoose_1.SchemaFactory.createForClass(DistrictPerformanceDaily);
exports.DistrictPerformanceDailySchema.index({ districtId: 1, date: 1 }, { unique: true });
//# sourceMappingURL=district-performance-daily.schema.js.map