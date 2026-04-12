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
exports.CreateChatConversationDto = exports.ChatIssueCategory = void 0;
const class_validator_1 = require("class-validator");
var ChatIssueCategory;
(function (ChatIssueCategory) {
    ChatIssueCategory["LOAN_ISSUE"] = "loan_issue";
    ChatIssueCategory["PAYMENT_ISSUE"] = "payment_issue";
    ChatIssueCategory["INSURANCE_ISSUE"] = "insurance_issue";
    ChatIssueCategory["KYC_ISSUE"] = "kyc_issue";
    ChatIssueCategory["GENERAL_HELP"] = "general_help";
})(ChatIssueCategory || (exports.ChatIssueCategory = ChatIssueCategory = {}));
class CreateChatConversationDto {
}
exports.CreateChatConversationDto = CreateChatConversationDto;
__decorate([
    (0, class_validator_1.IsEnum)(ChatIssueCategory),
    __metadata("design:type", String)
], CreateChatConversationDto.prototype, "issueCategory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateChatConversationDto.prototype, "loanId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1500),
    __metadata("design:type", String)
], CreateChatConversationDto.prototype, "initialMessage", void 0);
//# sourceMappingURL=create-chat-conversation.dto.js.map