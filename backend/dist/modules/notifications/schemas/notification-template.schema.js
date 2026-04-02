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
exports.NotificationTemplateSchema = exports.NotificationTemplate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const enums_1 = require("../../../common/enums");
let NotificationTemplate = class NotificationTemplate {
};
exports.NotificationTemplate = NotificationTemplate;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationCategory, index: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.NotificationTemplateType, unique: true, index: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "templateType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "messageBody", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: enums_1.NotificationChannel, default: [] }),
    __metadata("design:type", Array)
], NotificationTemplate.prototype, "channelDefaults", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true, index: true }),
    __metadata("design:type", Boolean)
], NotificationTemplate.prototype, "isActive", void 0);
exports.NotificationTemplate = NotificationTemplate = __decorate([
    (0, mongoose_1.Schema)({ collection: 'notification_templates', timestamps: true, versionKey: false })
], NotificationTemplate);
exports.NotificationTemplateSchema = mongoose_1.SchemaFactory.createForClass(NotificationTemplate);
exports.NotificationTemplateSchema.index({ category: 1, isActive: 1 });
//# sourceMappingURL=notification-template.schema.js.map