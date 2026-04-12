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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getSummary(currentUser, query) {
        return this.dashboardService.getSummary(currentUser, query);
    }
    getBranchPerformance(currentUser, query) {
        return this.dashboardService.getBranchPerformance(currentUser, query);
    }
    getDistrictPerformance(currentUser, query) {
        return this.dashboardService.getDistrictPerformance(currentUser, query);
    }
    getStaffRanking(currentUser, query) {
        return this.dashboardService.getStaffRanking(currentUser, query);
    }
    getVotingSummary(currentUser) {
        return this.dashboardService.getVotingSummary(currentUser);
    }
    getOnboardingReviewQueue(currentUser) {
        return this.dashboardService.getOnboardingReviewQueue(currentUser);
    }
    getOnboardingEvidenceDetail(currentUser, memberId) {
        return this.dashboardService.getOnboardingEvidenceDetail(currentUser, memberId);
    }
    getAutopayOperations(currentUser) {
        return this.dashboardService.getAutopayOperations(currentUser);
    }
    updateAutopayOperation(currentUser, id, dto) {
        return this.dashboardService.updateAutopayOperation(currentUser, id, dto);
    }
    updateOnboardingReview(currentUser, memberId, dto) {
        return this.dashboardService.updateOnboardingReview(currentUser, memberId, dto);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('branch-performance'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getBranchPerformance", null);
__decorate([
    (0, common_1.Get)('district-performance'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getDistrictPerformance", null);
__decorate([
    (0, common_1.Get)('staff-ranking'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStaffRanking", null);
__decorate([
    (0, common_1.Get)('voting-summary'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getVotingSummary", null);
__decorate([
    (0, common_1.Get)('onboarding-review'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getOnboardingReviewQueue", null);
__decorate([
    (0, common_1.Get)('onboarding-review/:memberId/evidence'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getOnboardingEvidenceDetail", null);
__decorate([
    (0, common_1.Get)('autopay-operations'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getAutopayOperations", null);
__decorate([
    (0, common_1.Patch)('autopay-operations/:id'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateAutopayOperationDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updateAutopayOperation", null);
__decorate([
    (0, common_1.Patch)('onboarding-review/:memberId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateOnboardingReviewDto]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updateOnboardingReview", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Controller)('manager/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map