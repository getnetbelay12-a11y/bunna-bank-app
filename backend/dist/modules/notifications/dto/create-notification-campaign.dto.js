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
exports.CreateNotificationCampaignDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../common/enums");
class CreateNotificationCampaignDto {
}
exports.CreateNotificationCampaignDto = CreateNotificationCampaignDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.NotificationCategory),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.NotificationTemplateType),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "templateType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(enums_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateNotificationCampaignDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['single_customer', 'selected_customers', 'filtered_customers']),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((value) => ['single_customer', 'selected_customers'].includes(value.targetType)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], CreateNotificationCampaignDto.prototype, "targetIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationCampaignDto.prototype, "filters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "messageSubject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "messageBody", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "demoRecipientEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateNotificationCampaignDto.prototype, "scheduledAt", void 0);
//# sourceMappingURL=create-notification-campaign.dto.js.map