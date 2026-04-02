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
exports.IdentityVerificationController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const identity_verification_service_1 = require("./identity-verification.service");
let IdentityVerificationController = class IdentityVerificationController {
    constructor(identityVerificationService) {
        this.identityVerificationService = identityVerificationService;
    }
    start(currentUser, dto) {
        return this.identityVerificationService.start(currentUser, dto.consentAccepted);
    }
    submitFin(currentUser, dto) {
        return this.identityVerificationService.submitFin(currentUser, dto);
    }
    uploadQr(currentUser, dto) {
        return this.identityVerificationService.uploadQr(currentUser, dto);
    }
    verify(currentUser) {
        return this.identityVerificationService.verify(currentUser);
    }
    getStatus(currentUser) {
        return this.identityVerificationService.getStatus(currentUser);
    }
};
exports.IdentityVerificationController = IdentityVerificationController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.StartFaydaVerificationDto]),
    __metadata("design:returntype", void 0)
], IdentityVerificationController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('submit-fin'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SubmitFaydaFinDto]),
    __metadata("design:returntype", void 0)
], IdentityVerificationController.prototype, "submitFin", null);
__decorate([
    (0, common_1.Post)('upload-qr'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UploadFaydaQrDto]),
    __metadata("design:returntype", void 0)
], IdentityVerificationController.prototype, "uploadQr", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityVerificationController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityVerificationController.prototype, "getStatus", null);
exports.IdentityVerificationController = IdentityVerificationController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('identity/fayda'),
    __metadata("design:paramtypes", [identity_verification_service_1.IdentityVerificationService])
], IdentityVerificationController);
//# sourceMappingURL=identity-verification.controller.js.map