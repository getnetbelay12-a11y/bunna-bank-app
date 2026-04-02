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
exports.AccountMemberRequestSchema = exports.AccountMemberRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let AccountMemberRequest = class AccountMemberRequest {
};
exports.AccountMemberRequest = AccountMemberRequest;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], AccountMemberRequest.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "memberName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "relationship", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "faydaDocumentUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "selfieImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], AccountMemberRequest.prototype, "selfieVerificationRequired", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'pending_review', index: true }),
    __metadata("design:type", String)
], AccountMemberRequest.prototype, "status", void 0);
exports.AccountMemberRequest = AccountMemberRequest = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'account_member_requests',
        timestamps: true,
        versionKey: false,
    })
], AccountMemberRequest);
exports.AccountMemberRequestSchema = mongoose_1.SchemaFactory.createForClass(AccountMemberRequest);
//# sourceMappingURL=account-member-request.schema.js.map