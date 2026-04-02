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
exports.VoteResponseSchema = exports.VoteResponse = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let VoteResponse = class VoteResponse {
};
exports.VoteResponse = VoteResponse;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Vote', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteResponse.prototype, "voteId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteResponse.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'VoteOption', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteResponse.prototype, "optionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteResponse.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteResponse.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], VoteResponse.prototype, "encryptedBallot", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], VoteResponse.prototype, "otpVerifiedAt", void 0);
exports.VoteResponse = VoteResponse = __decorate([
    (0, mongoose_1.Schema)({ collection: 'vote_responses', timestamps: true, versionKey: false })
], VoteResponse);
exports.VoteResponseSchema = mongoose_1.SchemaFactory.createForClass(VoteResponse);
exports.VoteResponseSchema.index({ voteId: 1, memberId: 1 }, { unique: true });
exports.VoteResponseSchema.index({ voteId: 1, optionId: 1 });
//# sourceMappingURL=vote-response.schema.js.map