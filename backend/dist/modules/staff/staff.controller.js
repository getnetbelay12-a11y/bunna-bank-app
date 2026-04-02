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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const staff_service_1 = require("./staff.service");
let StaffController = class StaffController {
    constructor(staffService) {
        this.staffService = staffService;
    }
    getMyProfile(currentUser) {
        return this.staffService.getMyProfile(currentUser);
    }
    listStaff(currentUser, query) {
        return this.staffService.listStaff(currentUser, query);
    }
    getBranchStaff(currentUser, branchId) {
        return this.staffService.getBranchStaff(currentUser, branchId);
    }
    getDistrictStaff(currentUser, districtId) {
        return this.staffService.getDistrictStaff(currentUser, districtId);
    }
    getStaffById(currentUser, staffId) {
        return this.staffService.getStaffById(currentUser, staffId);
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListStaffQueryDto]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Get)('branch/:branchId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getBranchStaff", null);
__decorate([
    (0, common_1.Get)('district/:districtId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('districtId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getDistrictStaff", null);
__decorate([
    (0, common_1.Get)(':staffId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('staffId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getStaffById", null);
exports.StaffController = StaffController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map