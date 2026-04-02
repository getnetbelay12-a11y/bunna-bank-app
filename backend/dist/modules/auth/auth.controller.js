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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    checkExistingAccount(dto) {
        return this.authService.checkExistingAccount(dto);
    }
    register(dto) {
        return this.authService.registerMember(dto);
    }
    startLogin(dto) {
        return this.authService.startLogin(dto);
    }
    verifyPinLogin(dto) {
        return this.authService.verifyPinLogin(dto);
    }
    login(dto) {
        return this.authService.loginMember(dto);
    }
    loginMember(dto) {
        return this.authService.loginMember(dto);
    }
    loginStaff(dto) {
        return this.authService.loginStaff(dto);
    }
    requestOtp(dto) {
        return this.authService.requestOtp(dto);
    }
    verifyOtp(dto) {
        return this.authService.verifyOtp(dto);
    }
    logout(currentUser) {
        return this.authService.logout(currentUser);
    }
    getCurrentSession(currentUser) {
        return this.authService.getCurrentSession(currentUser);
    }
    refreshTokens(currentUser, dto) {
        return this.authService.refreshTokens(currentUser, dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('check-existing-account'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CheckExistingAccountDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "checkExistingAccount", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterMemberDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('start-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StartLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "startLogin", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('verify-pin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyPinLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPinLogin", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MemberLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('member/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MemberLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginMember", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('staff/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StaffLoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginStaff", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('request-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RequestOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCurrentSession", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Post)('refresh'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshTokens", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map