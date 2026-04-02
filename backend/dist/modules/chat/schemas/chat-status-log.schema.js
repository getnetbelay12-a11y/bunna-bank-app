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
exports.ChatStatusLogSchema = exports.ChatStatusLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ChatStatusLog = class ChatStatusLog {
};
exports.ChatStatusLog = ChatStatusLog;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        type: mongoose_2.Types.ObjectId,
        ref: 'ChatConversation',
        index: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ChatStatusLog.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: [
            'open',
            'assigned',
            'waiting_customer',
            'waiting_agent',
            'resolved',
            'closed',
        ],
    }),
    __metadata("design:type", String)
], ChatStatusLog.prototype, "fromStatus", void 0);
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
], ChatStatusLog.prototype, "toStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['customer', 'agent', 'system'] }),
    __metadata("design:type", String)
], ChatStatusLog.prototype, "changedByType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ChatStatusLog.prototype, "changedById", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], ChatStatusLog.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], ChatStatusLog.prototype, "createdAt", void 0);
exports.ChatStatusLog = ChatStatusLog = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'chat_status_logs',
        timestamps: false,
        versionKey: false,
    })
], ChatStatusLog);
exports.ChatStatusLogSchema = mongoose_1.SchemaFactory.createForClass(ChatStatusLog);
exports.ChatStatusLogSchema.index({ conversationId: 1, createdAt: -1 });
//# sourceMappingURL=chat-status-log.schema.js.map