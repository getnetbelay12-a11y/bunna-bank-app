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
exports.NotificationCampaignSchema = exports.NotificationCampaign = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let NotificationCampaign = class NotificationCampaign {
};
exports.NotificationCampaign = NotificationCampaign;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationCategory, index: true }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationTemplateType, index: true }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "templateType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: enums_1.NotificationChannel, default: [] }),
    __metadata("design:type", Array)
], NotificationCampaign.prototype, "channels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['single_customer', 'selected_customers', 'filtered_customers'] }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "targetType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], default: [] }),
    __metadata("design:type", Array)
], NotificationCampaign.prototype, "targetIds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.SchemaTypes.Mixed }),
    __metadata("design:type", Object)
], NotificationCampaign.prototype, "filters", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "messageSubject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "messageBody", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationCampaignStatus, index: true }),
    __metadata("design:type", String)
], NotificationCampaign.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], NotificationCampaign.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], NotificationCampaign.prototype, "scheduledAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], NotificationCampaign.prototype, "sentAt", void 0);
exports.NotificationCampaign = NotificationCampaign = __decorate([
    (0, mongoose_1.Schema)({ collection: 'notification_campaigns', timestamps: { createdAt: true, updatedAt: false }, versionKey: false })
], NotificationCampaign);
exports.NotificationCampaignSchema = mongoose_1.SchemaFactory.createForClass(NotificationCampaign);
exports.NotificationCampaignSchema.index({ createdBy: 1, createdAt: -1 });
exports.NotificationCampaignSchema.index({ status: 1, category: 1, createdAt: -1 });
//# sourceMappingURL=notification-campaign.schema.js.map