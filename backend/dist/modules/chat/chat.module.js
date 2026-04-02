"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const chat_assignment_schema_1 = require("./schemas/chat-assignment.schema");
const chat_conversation_schema_1 = require("./schemas/chat-conversation.schema");
const chat_message_schema_1 = require("./schemas/chat-message.schema");
const chat_participant_schema_1 = require("./schemas/chat-participant.schema");
const chat_status_log_schema_1 = require("./schemas/chat-status-log.schema");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: chat_conversation_schema_1.ChatConversation.name, schema: chat_conversation_schema_1.ChatConversationSchema },
                { name: chat_message_schema_1.ChatMessage.name, schema: chat_message_schema_1.ChatMessageSchema },
                { name: chat_participant_schema_1.ChatParticipant.name, schema: chat_participant_schema_1.ChatParticipantSchema },
                { name: chat_assignment_schema_1.ChatAssignment.name, schema: chat_assignment_schema_1.ChatAssignmentSchema },
                { name: chat_status_log_schema_1.ChatStatusLog.name, schema: chat_status_log_schema_1.ChatStatusLogSchema },
            ]),
            notifications_module_1.NotificationsModule,
            audit_module_1.AuditModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map