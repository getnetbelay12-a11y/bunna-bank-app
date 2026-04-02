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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplateService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_template_registry_1 = require("./notification-template.registry");
const notification_template_schema_1 = require("./schemas/notification-template.schema");
let NotificationTemplateService = class NotificationTemplateService {
    constructor(notificationTemplateModel) {
        this.notificationTemplateModel = notificationTemplateModel;
    }
    async listTemplates() {
        const storedTemplates = await this.notificationTemplateModel
            .find({})
            .sort({ category: 1, templateType: 1 })
            .lean();
        const storedByType = new Map(storedTemplates.map((item) => [item.templateType, item]));
        return notification_template_registry_1.NOTIFICATION_TEMPLATE_DEFINITIONS.map((definition) => {
            const stored = storedByType.get(definition.templateType);
            return stored ?? {
                _id: definition.templateType,
                category: definition.category,
                templateType: definition.templateType,
                title: definition.title,
                subject: definition.subject,
                messageBody: definition.messageBody,
                channelDefaults: definition.channelDefaults,
                isActive: true,
            };
        });
    }
    async createTemplate(dto) {
        return this.notificationTemplateModel.create({
            ...dto,
            isActive: dto.isActive ?? true,
        });
    }
    async updateTemplate(templateId, dto) {
        const template = await this.notificationTemplateModel.findByIdAndUpdate(templateId, { $set: dto }, { new: true });
        if (!template) {
            throw new common_1.NotFoundException('Notification template not found.');
        }
        return template;
    }
    async getTemplateByType(templateType) {
        const template = await this.notificationTemplateModel.findOne({
            templateType,
            isActive: true,
        });
        if (template) {
            return template;
        }
        const definition = (0, notification_template_registry_1.getNotificationTemplateDefinition)(templateType);
        if (!definition) {
            throw new common_1.NotFoundException('Active notification template not found.');
        }
        return {
            _id: definition.templateType,
            category: definition.category,
            templateType: definition.templateType,
            title: definition.title,
            subject: definition.subject,
            messageBody: definition.messageBody,
            channelDefaults: definition.channelDefaults,
            isActive: true,
        };
    }
};
exports.NotificationTemplateService = NotificationTemplateService;
exports.NotificationTemplateService = NotificationTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_template_schema_1.NotificationTemplate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], NotificationTemplateService);
//# sourceMappingURL=notification-template.service.js.map