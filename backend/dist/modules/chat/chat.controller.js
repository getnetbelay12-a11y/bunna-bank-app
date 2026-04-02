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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("./dto");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    listMyConversations(currentUser) {
        return this.chatService.listMyConversations(currentUser);
    }
    createConversation(currentUser, dto) {
        return this.chatService.createConversation(currentUser, dto);
    }
    getConversation(currentUser, conversationId) {
        return this.chatService.getMyConversation(currentUser, conversationId);
    }
    sendMessage(currentUser, conversationId, dto) {
        return this.chatService.sendCustomerMessage(currentUser, conversationId, dto);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMyConversations", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateChatConversationDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)(':conversationId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Post)(':conversationId/messages'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreateChatMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.MEMBER, enums_1.UserRole.SHAREHOLDER_MEMBER),
    (0, common_1.Controller)('chat/conversations'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map