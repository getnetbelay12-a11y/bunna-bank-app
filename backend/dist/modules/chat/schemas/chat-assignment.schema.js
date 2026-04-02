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
exports.ChatAssignmentSchema = exports.ChatAssignment = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ChatAssignment = class ChatAssignment {
};
exports.ChatAssignment = ChatAssignment;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: mongoose_2.Types.ObjectId,
        ref: 'ChatConversation',
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatAssignment.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Staff', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatAssignment.prototype, "assignedToStaffId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Staff' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], ChatAssignment.prototype, "createdAt", void 0);
exports.ChatAssignment = ChatAssignment = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'chat_assignments',
        timestamps: false,
        versionKey: false,
    })
], ChatAssignment);
exports.ChatAssignmentSchema = mongoose_1.SchemaFactory.createForClass(ChatAssignment);
exports.ChatAssignmentSchema.index({ conversationId: 1, createdAt: -1 });
//# sourceMappingURL=chat-assignment.schema.js.map