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
exports.InsuranceController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const insurance_alert_service_1 = require("./insurance-alert.service");
let InsuranceController = class InsuranceController {
    constructor(insuranceAlertService) {
        this.insuranceAlertService = insuranceAlertService;
    }
    getAlerts(currentUser) {
        return this.insuranceAlertService.getAlerts(currentUser);
    }
    getExpiringThirtyDays(currentUser) {
        return this.insuranceAlertService.getAlertsByType(currentUser, 'expiring_30_days');
    }
    getExpiringSevenDays(currentUser) {
        return this.insuranceAlertService.getAlertsByType(currentUser, 'expiring_7_days');
    }
    getExpired(currentUser) {
        return this.insuranceAlertService.getAlertsByType(currentUser, 'expired');
    }
    getWithoutValidInsurance(currentUser) {
        return this.insuranceAlertService.getAlerts(currentUser).then((alerts) => alerts.filter((item) => ['loan_without_valid_insurance', 'loan_without_linked_insurance'].includes(item.alertType)));
    }
};
exports.InsuranceController = InsuranceController;
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InsuranceController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('alerts/expiring-30-days'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InsuranceController.prototype, "getExpiringThirtyDays", null);
__decorate([
    (0, common_1.Get)('alerts/expiring-7-days'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InsuranceController.prototype, "getExpiringSevenDays", null);
__decorate([
    (0, common_1.Get)('alerts/expired'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InsuranceController.prototype, "getExpired", null);
__decorate([
    (0, common_1.Get)('alerts/loan-without-valid-insurance'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InsuranceController.prototype, "getWithoutValidInsurance", null);
exports.InsuranceController = InsuranceController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Controller)('manager/insurance'),
    __metadata("design:paramtypes", [insurance_alert_service_1.InsuranceAlertService])
], InsuranceController);
//# sourceMappingURL=insurance.controller.js.map