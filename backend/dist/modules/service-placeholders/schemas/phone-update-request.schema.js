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
exports.PhoneUpdateRequestSchema = exports.PhoneUpdateRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let PhoneUpdateRequest = class PhoneUpdateRequest {
};
exports.PhoneUpdateRequest = PhoneUpdateRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PhoneUpdateRequest.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "currentPhoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "requestedPhoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "faydaFrontImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "faydaBackImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "selfieImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PhoneUpdateRequest.prototype, "faydaVerificationRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PhoneUpdateRequest.prototype, "selfieVerificationRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'pending_review', index: true }),
    __metadata("design:type", String)
], PhoneUpdateRequest.prototype, "status", void 0);
exports.PhoneUpdateRequest = PhoneUpdateRequest = __decorate([
    (0, mongoose_1.Schema)({ collection: 'phone_update_requests', timestamps: true, versionKey: false })
], PhoneUpdateRequest);
exports.PhoneUpdateRequestSchema = mongoose_1.SchemaFactory.createForClass(PhoneUpdateRequest);
//# sourceMappingURL=phone-update-request.schema.js.map