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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVerificationSchema = exports.IdentityVerification = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let IdentityVerification = class IdentityVerification {
};
exports.IdentityVerification = IdentityVerification;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], IdentityVerification.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, sparse: true, index: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "faydaFin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "faydaAlias", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IdentityVerification.prototype, "qrDataRaw", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "verificationMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "verificationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], IdentityVerification.prototype, "verifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "verificationReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], IdentityVerification.prototype, "failureReason", void 0);
exports.IdentityVerification = IdentityVerification = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'identity_verifications',
        timestamps: true,
        versionKey: false,
    })
], IdentityVerification);
exports.IdentityVerificationSchema = mongoose_1.SchemaFactory.createForClass(IdentityVerification);
exports.IdentityVerificationSchema.index({ memberId: 1, createdAt: -1 });
exports.IdentityVerificationSchema.index({ phoneNumber: 1, verificationStatus: 1 });
//# sourceMappingURL=identity-verification.schema.js.map