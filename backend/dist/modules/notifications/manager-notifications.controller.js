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
exports.ManagerNotificationsController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const notification_campaign_service_1 = require("./notification-campaign.service");
const notification_template_service_1 = require("./notification-template.service");
let ManagerNotificationsController = class ManagerNotificationsController {
    constructor(notificationTemplateService, notificationCampaignService) {
        this.notificationTemplateService = notificationTemplateService;
        this.notificationCampaignService = notificationCampaignService;
    }
    listTemplates() {
        return this.notificationTemplateService.listTemplates();
    }
    createTemplate(dto) {
        return this.notificationTemplateService.createTemplate(dto);
    }
    updateTemplate(templateId, dto) {
        return this.notificationTemplateService.updateTemplate(templateId, dto);
    }
    listCampaigns(currentUser) {
        return this.notificationCampaignService.listCampaigns(currentUser);
    }
    createCampaign(currentUser, dto) {
        return this.notificationCampaignService.createCampaign(currentUser, dto);
    }
    getCampaign(currentUser, campaignId) {
        return this.notificationCampaignService.getCampaign(currentUser, campaignId);
    }
    sendCampaign(currentUser, campaignId) {
        return this.notificationCampaignService.sendCampaign(currentUser, campaignId);
    }
    listLogs(currentUser) {
        return this.notificationCampaignService.listLogs(currentUser);
    }
    listLogsByCampaign(currentUser, campaignId) {
        return this.notificationCampaignService.listLogs(currentUser, campaignId);
    }
};
exports.ManagerNotificationsController = ManagerNotificationsController;
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:templateId'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "listCampaigns", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateNotificationCampaignDto]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "getCampaign", null);
__decorate([
    (0, common_1.Post)('campaigns/:campaignId/send'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "sendCampaign", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "listLogs", null);
__decorate([
    (0, common_1.Get)('logs/:campaignId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ManagerNotificationsController.prototype, "listLogsByCampaign", null);
exports.ManagerNotificationsController = ManagerNotificationsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Controller)('manager/notifications'),
    __metadata("design:paramtypes", [notification_template_service_1.NotificationTemplateService,
        notification_campaign_service_1.NotificationCampaignService])
], ManagerNotificationsController);
//# sourceMappingURL=manager-notifications.controller.js.map