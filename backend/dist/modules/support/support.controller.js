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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
const guards_1 = require("../../common/guards");
const dto_1 = require("../chat/dto");
const chat_service_1 = require("../chat/chat.service");
const dto_2 = require("./dto");
let SupportController = class SupportController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    getOpenChats(currentUser) {
        return this.chatService.listOpenChats(currentUser);
    }
    getAssignedChats(currentUser) {
        return this.chatService.listAssignedChats(currentUser);
    }
    getResolvedChats(currentUser) {
        return this.chatService.listResolvedChats(currentUser);
    }
    getChat(currentUser, conversationId) {
        return this.chatService.getSupportConversation(currentUser, conversationId);
    }
    assignChat(currentUser, conversationId, dto) {
        return this.chatService.assignConversation(currentUser, conversationId, dto.agentId);
    }
    reply(currentUser, conversationId, dto) {
        return this.chatService.replyAsAgent(currentUser, conversationId, dto);
    }
    updateStatus(currentUser, conversationId, dto) {
        return this.chatService.updateSupportConversationStatus(currentUser, conversationId, dto.status);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Get)('open'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getOpenChats", null);
__decorate([
    (0, common_1.Get)('assigned'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getAssignedChats", null);
__decorate([
    (0, common_1.Get)('resolved'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getResolvedChats", null);
__decorate([
    (0, common_1.Get)(':conversationId'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "getChat", null);
__decorate([
    (0, common_1.Post)(':conversationId/assign'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_2.AssignChatDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "assignChat", null);
__decorate([
    (0, common_1.Post)(':conversationId/messages'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreateChatMessageDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "reply", null);
__decorate([
    (0, common_1.Patch)(':conversationId/status'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('conversationId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_2.UpdateChatStatusDto]),
    __metadata("design:returntype", void 0)
], SupportController.prototype, "updateStatus", null);
exports.SupportController = SupportController = __decorate([
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPPORT_AGENT, enums_1.UserRole.ADMIN, enums_1.UserRole.HEAD_OFFICE_OFFICER, enums_1.UserRole.HEAD_OFFICE_MANAGER, enums_1.UserRole.BRANCH_MANAGER),
    (0, common_1.Controller)('support/console/chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], SupportController);
//# sourceMappingURL=support.controller.js.map