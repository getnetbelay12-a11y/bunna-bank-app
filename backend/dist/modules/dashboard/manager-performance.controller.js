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
exports.ManagerPerformanceController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const manager_performance_service_1 = require("./manager-performance.service");
let ManagerPerformanceController = class ManagerPerformanceController {
    constructor(managerPerformanceService) {
        this.managerPerformanceService = managerPerformanceService;
    }
    getHeadOfficeDistrictSummary(currentUser, query) {
        return this.managerPerformanceService.getHeadOfficeDistrictSummary(currentUser, query);
    }
    getHeadOfficeTopDistricts(currentUser, query) {
        return this.managerPerformanceService.getHeadOfficeTopDistricts(currentUser, query);
    }
    getHeadOfficeDistrictWatchlist(currentUser, query) {
        return this.managerPerformanceService.getHeadOfficeDistrictWatchlist(currentUser, query);
    }
    getDistrictBranchSummary(currentUser, query) {
        return this.managerPerformanceService.getDistrictBranchSummary(currentUser, query);
    }
    getDistrictTopBranches(currentUser, query) {
        return this.managerPerformanceService.getDistrictTopBranches(currentUser, query);
    }
    getDistrictBranchWatchlist(currentUser, query) {
        return this.managerPerformanceService.getDistrictBranchWatchlist(currentUser, query);
    }
    getBranchEmployeeSummary(currentUser, query) {
        return this.managerPerformanceService.getBranchEmployeeSummary(currentUser, query);
    }
    getBranchTopEmployees(currentUser, query) {
        return this.managerPerformanceService.getBranchTopEmployees(currentUser, query);
    }
    getBranchEmployeeWatchlist(currentUser, query) {
        return this.managerPerformanceService.getBranchEmployeeWatchlist(currentUser, query);
    }
};
exports.ManagerPerformanceController = ManagerPerformanceController;
__decorate([
    (0, common_1.Get)('head-office/performance/districts/summary'),
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getHeadOfficeDistrictSummary", null);
__decorate([
    (0, common_1.Get)('head-office/performance/districts/top'),
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getHeadOfficeTopDistricts", null);
__decorate([
    (0, common_1.Get)('head-office/performance/districts/watchlist'),
    (0, decorators_1.Roles)(enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getHeadOfficeDistrictWatchlist", null);
__decorate([
    (0, common_1.Get)('district/performance/branches/summary'),
    (0, decorators_1.Roles)(enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getDistrictBranchSummary", null);
__decorate([
    (0, common_1.Get)('district/performance/branches/top'),
    (0, decorators_1.Roles)(enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getDistrictTopBranches", null);
__decorate([
    (0, common_1.Get)('district/performance/branches/watchlist'),
    (0, decorators_1.Roles)(enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getDistrictBranchWatchlist", null);
__decorate([
    (0, common_1.Get)('branch/performance/employees/summary'),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getBranchEmployeeSummary", null);
__decorate([
    (0, common_1.Get)('branch/performance/employees/top'),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getBranchTopEmployees", null);
__decorate([
    (0, common_1.Get)('branch/performance/employees/watchlist'),
    (0, decorators_1.Roles)(enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.ADMIN),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DashboardPeriodQueryDto]),
    __metadata("design:returntype", void 0)
], ManagerPerformanceController.prototype, "getBranchEmployeeWatchlist", null);
exports.ManagerPerformanceController = ManagerPerformanceController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, common_1.Controller)('manager'),
    __metadata("design:paramtypes", [manager_performance_service_1.ManagerPerformanceService])
], ManagerPerformanceController);
//# sourceMappingURL=manager-performance.controller.js.map