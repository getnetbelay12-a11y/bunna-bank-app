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
exports.StaffActivityLogSchema = exports.StaffActivityLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let StaffActivityLog = class StaffActivityLog {
};
exports.StaffActivityLog = StaffActivityLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffActivityLog.prototype, "staffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffActivityLog.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffActivityLog.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffActivityLog.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.ActivityType, index: true }),
    __metadata("design:type", String)
], StaffActivityLog.prototype, "activityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], StaffActivityLog.prototype, "referenceType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], StaffActivityLog.prototype, "referenceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, default: 0 }),
    __metadata("design:type", Number)
], StaffActivityLog.prototype, "amount", void 0);
exports.StaffActivityLog = StaffActivityLog = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'staff_activity_logs',
        timestamps: true,
        versionKey: false,
    })
], StaffActivityLog);
exports.StaffActivityLogSchema = mongoose_1.SchemaFactory.createForClass(StaffActivityLog);
exports.StaffActivityLogSchema.index({ staffId: 1, createdAt: -1 });
exports.StaffActivityLogSchema.index({ branchId: 1, activityType: 1, createdAt: -1 });
//# sourceMappingURL=staff-activity-log.schema.js.map