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
exports.NotificationLogSchema = exports.NotificationLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let NotificationLog = class NotificationLog {
};
exports.NotificationLog = NotificationLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'NotificationCampaign', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotificationLog.prototype, "campaignId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotificationLog.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationCategory, index: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationChannel, index: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "channel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "recipient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationLogStatus, index: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "providerMessageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "messageSubject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "messageBody", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], NotificationLog.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], NotificationLog.prototype, "deliveredAt", void 0);
exports.NotificationLog = NotificationLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'notification_logs', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
], NotificationLog);
exports.NotificationLogSchema = mongoose_1.SchemaFactory.createForClass(NotificationLog);
exports.NotificationLogSchema.index({ campaignId: 1, createdAt: -1 });
exports.NotificationLogSchema.index({ memberId: 1, category: 1, createdAt: -1 });
//# sourceMappingURL=notification-log.schema.js.map