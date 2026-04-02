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
exports.ChatConversationSchema = exports.ChatConversation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../../common/enums");
const dto_1 = require("../dto");
let ChatConversation = class ChatConversation {
};
exports.ChatConversation = ChatConversation;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Member', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatConversation.prototype, "memberId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "memberName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: enums_1.MemberType, index: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "memberType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Branch', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatConversation.prototype, "branchId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'District', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatConversation.prototype, "districtId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "districtName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatConversation.prototype, "assignedToStaffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "assignedToStaffName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: [
            'open',
            'assigned',
            'waiting_customer',
            'waiting_agent',
            'resolved',
            'closed',
        ],
        index: true,
    }),
    __metadata("design:type", String)
], ChatConversation.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['mobile'], default: 'mobile' }),
    __metadata("design:type", String)
], ChatConversation.prototype, "channel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: dto_1.ChatIssueCategory, index: true }),
    __metadata("design:type", String)
], ChatConversation.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['low', 'normal', 'high'], default: 'normal' }),
    __metadata("design:type", String)
], ChatConversation.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], ChatConversation.prototype, "escalationFlag", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", Date)
], ChatConversation.prototype, "lastMessageAt", void 0);
exports.ChatConversation = ChatConversation = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'chat_conversations',
        timestamps: true,
        versionKey: false,
    })
], ChatConversation);
exports.ChatConversationSchema = mongoose_1.SchemaFactory.createForClass(ChatConversation);
exports.ChatConversationSchema.index({ memberId: 1, updatedAt: -1 });
exports.ChatConversationSchema.index({
    status: 1,
    assignedToStaffId: 1,
    lastMessageAt: -1,
});
//# sourceMappingURL=chat-conversation.schema.js.map