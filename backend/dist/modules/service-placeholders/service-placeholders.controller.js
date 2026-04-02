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
exports.ServicePlaceholdersController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const add_member_dto_1 = require("./dto/add-member.dto");
const create_atm_card_request_dto_1 = require("./dto/create-atm-card-request.dto");
const create_autopay_dto_1 = require("./dto/create-autopay.dto");
const selfie_verify_dto_1 = require("./dto/selfie-verify.dto");
const update_account_lock_dto_1 = require("./dto/update-account-lock.dto");
const update_autopay_status_dto_1 = require("./dto/update-autopay-status.dto");
const update_phone_dto_1 = require("./dto/update-phone.dto");
const service_placeholders_service_1 = require("./service-placeholders.service");
let ServicePlaceholdersController = class ServicePlaceholdersController {
    constructor(servicePlaceholdersService) {
        this.servicePlaceholdersService = servicePlaceholdersService;
    }
    createAutopay(currentUser, dto) {
        return this.servicePlaceholdersService.createAutopay(currentUser, dto);
    }
    listAutopay(currentUser) {
        return this.servicePlaceholdersService.listAutopay(currentUser);
    }
    updateAutopayStatus(currentUser, dto) {
        return this.servicePlaceholdersService.updateAutopayStatus(currentUser, dto);
    }
    updateAccountLock(currentUser, dto) {
        return this.servicePlaceholdersService.updateAccountLock(currentUser, dto);
    }
    getAccountLock(currentUser) {
        return this.servicePlaceholdersService.getAccountLock(currentUser);
    }
    createAtmCardRequest(currentUser, dto) {
        return this.servicePlaceholdersService.createAtmCardRequest(currentUser, dto);
    }
    updatePhone(currentUser, dto) {
        return this.servicePlaceholdersService.updatePhone(currentUser, dto);
    }
    addMember(currentUser, dto) {
        return this.servicePlaceholdersService.addMember(currentUser, dto);
    }
    selfieVerify(currentUser, dto) {
        return this.servicePlaceholdersService.selfieVerify(currentUser, dto);
    }
};
exports.ServicePlaceholdersController = ServicePlaceholdersController;
__decorate([
    (0, common_1.Post)('autopay/create'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_autopay_dto_1.CreateAutopayDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "createAutopay", null);
__decorate([
    (0, common_1.Get)('autopay/list'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "listAutopay", null);
__decorate([
    (0, common_1.Patch)('autopay/status'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_autopay_status_dto_1.UpdateAutopayStatusDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "updateAutopayStatus", null);
__decorate([
    (0, common_1.Patch)('security/account-lock'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_account_lock_dto_1.UpdateAccountLockDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "updateAccountLock", null);
__decorate([
    (0, common_1.Get)('security/account-lock'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "getAccountLock", null);
__decorate([
    (0, common_1.Post)('atm-card/request'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_atm_card_request_dto_1.CreateAtmCardRequestDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "createAtmCardRequest", null);
__decorate([
    (0, common_1.Post)('profile/update-phone'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_phone_dto_1.UpdatePhoneDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "updatePhone", null);
__decorate([
    (0, common_1.Post)('account/add-member'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_member_dto_1.AddMemberDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "addMember", null);
__decorate([
    (0, common_1.Post)('kyc/selfie-verify'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, selfie_verify_dto_1.SelfieVerifyDto]),
    __metadata("design:returntype", void 0)
], ServicePlaceholdersController.prototype, "selfieVerify", null);
exports.ServicePlaceholdersController = ServicePlaceholdersController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.MEMBER, enums_1.UserRole.SHAREHOLDER_MEMBER),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [service_placeholders_service_1.ServicePlaceholdersService])
], ServicePlaceholdersController);
//# sourceMappingURL=service-placeholders.controller.js.map