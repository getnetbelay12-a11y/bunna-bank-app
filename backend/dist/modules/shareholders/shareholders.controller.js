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
exports.ShareholdersController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const shareholders_service_1 = require("./shareholders.service");
let ShareholdersController = class ShareholdersController {
    constructor(shareholdersService) {
        this.shareholdersService = shareholdersService;
    }
    getMyShareholderProfile(currentUser) {
        return this.shareholdersService.getMyShareholderProfile(currentUser);
    }
    getMyVotingEligibility(currentUser) {
        return this.shareholdersService.getMyVotingEligibility(currentUser);
    }
    getShareholderById(currentUser, memberId) {
        return this.shareholdersService.getShareholderById(currentUser, memberId);
    }
    getVotingEligibilityByMemberId(currentUser, memberId) {
        return this.shareholdersService.getVotingEligibilityByMemberId(currentUser, memberId);
    }
};
exports.ShareholdersController = ShareholdersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShareholdersController.prototype, "getMyShareholderProfile", null);
__decorate([
    (0, common_1.Get)('me/voting-eligibility'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShareholdersController.prototype, "getMyVotingEligibility", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)(':memberId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ShareholdersController.prototype, "getShareholderById", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)(':memberId/voting-eligibility'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ShareholdersController.prototype, "getVotingEligibilityByMemberId", null);
exports.ShareholdersController = ShareholdersController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, common_1.Controller)('shareholders'),
    __metadata("design:paramtypes", [shareholders_service_1.ShareholdersService])
], ShareholdersController);
//# sourceMappingURL=shareholders.controller.js.map