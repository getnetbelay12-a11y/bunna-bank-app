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
exports.VoteAuditLogSchema = exports.VoteAuditLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
let VoteAuditLog = class VoteAuditLog {
};
exports.VoteAuditLog = VoteAuditLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Vote', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteAuditLog.prototype, "voteId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteAuditLog.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], VoteAuditLog.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], VoteAuditLog.prototype, "actorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: enums_1.UserRole }),
    __metadata("design:type", String)
], VoteAuditLog.prototype, "actorRole", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.Mixed }),
    __metadata("design:type", Object)
], VoteAuditLog.prototype, "metadata", void 0);
exports.VoteAuditLog = VoteAuditLog = __decorate([
    (0, mongoose_1.Schema)({ collection: 'vote_audit_logs', timestamps: true, versionKey: false })
], VoteAuditLog);
exports.VoteAuditLogSchema = mongoose_1.SchemaFactory.createForClass(VoteAuditLog);
exports.VoteAuditLogSchema.index({ voteId: 1, createdAt: -1 });
//# sourceMappingURL=vote-audit-log.schema.js.map