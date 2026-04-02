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
exports.MemberProfileSchema = exports.MemberProfileEntity = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let MemberProfileEntity = class MemberProfileEntity {
};
exports.MemberProfileEntity = MemberProfileEntity;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', unique: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MemberProfileEntity.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], MemberProfileEntity.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MemberProfileEntity.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], MemberProfileEntity.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'pending_verification', index: true }),
    __metadata("design:type", String)
], MemberProfileEntity.prototype, "membershipStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'not_started', index: true }),
    __metadata("design:type", String)
], MemberProfileEntity.prototype, "identityVerificationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], MemberProfileEntity.prototype, "consentAccepted", void 0);
exports.MemberProfileEntity = MemberProfileEntity = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'member_profiles',
        timestamps: true,
        versionKey: false,
    })
], MemberProfileEntity);
exports.MemberProfileSchema = mongoose_1.SchemaFactory.createForClass(MemberProfileEntity);
exports.MemberProfileSchema.index({ branchId: 1, membershipStatus: 1 });
//# sourceMappingURL=member-profile.schema.js.map