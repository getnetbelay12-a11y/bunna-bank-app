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
exports.ChatParticipantSchema = exports.ChatParticipant = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ChatParticipant = class ChatParticipant {
};
exports.ChatParticipant = ChatParticipant;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: mongoose_2.Types.ObjectId,
        ref: 'ChatConversation',
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatParticipant.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['customer', 'agent', 'system'], index: true }),
    __metadata("design:type", String)
], ChatParticipant.prototype, "participantType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, index: true }),
    __metadata("design:type", String)
], ChatParticipant.prototype, "participantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], ChatParticipant.prototype, "joinedAt", void 0);
exports.ChatParticipant = ChatParticipant = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'chat_participants',
        timestamps: false,
        versionKey: false,
    })
], ChatParticipant);
exports.ChatParticipantSchema = mongoose_1.SchemaFactory.createForClass(ChatParticipant);
exports.ChatParticipantSchema.index({ conversationId: 1, participantType: 1, participantId: 1 }, { unique: true });
//# sourceMappingURL=chat-participant.schema.js.map