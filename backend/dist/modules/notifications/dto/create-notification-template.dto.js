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
exports.CreateNotificationTemplateDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../common/enums");
class CreateNotificationTemplateDto {
}
exports.CreateNotificationTemplateDto = CreateNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.NotificationCategory),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.NotificationTemplateType),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "templateType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "messageBody", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(enums_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateNotificationTemplateDto.prototype, "channelDefaults", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNotificationTemplateDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-notification-template.dto.js.map