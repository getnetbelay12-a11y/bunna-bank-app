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
exports.SavingsController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const savings_service_1 = require("./savings.service");
let SavingsController = class SavingsController {
    constructor(savingsService) {
        this.savingsService = savingsService;
    }
    getMyAccounts(currentUser) {
        return this.savingsService.getMyAccounts(currentUser);
    }
    getAccountDetail(currentUser, accountId) {
        return this.savingsService.getAccountDetail(currentUser, accountId);
    }
    getAccountTransactions(currentUser, accountId, query) {
        return this.savingsService.getAccountTransactions(currentUser, accountId, query);
    }
    getMemberAccounts(currentUser, memberId) {
        return this.savingsService.getMemberAccounts(currentUser, memberId);
    }
};
exports.SavingsController = SavingsController;
__decorate([
    (0, common_1.Get)('accounts/my'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SavingsController.prototype, "getMyAccounts", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SavingsController.prototype, "getAccountDetail", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId/transactions'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('accountId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ListAccountTransactionsQueryDto]),
    __metadata("design:returntype", void 0)
], SavingsController.prototype, "getAccountTransactions", null);
__decorate([
    (0, decorators_1.Roles)(enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER, enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.ADMIN),
    (0, common_1.Get)('accounts/member/:memberId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SavingsController.prototype, "getMemberAccounts", null);
exports.SavingsController = SavingsController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, common_1.Controller)('savings'),
    __metadata("design:paramtypes", [savings_service_1.SavingsService])
], SavingsController);
//# sourceMappingURL=savings.controller.js.map