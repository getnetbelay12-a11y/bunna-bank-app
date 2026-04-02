import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {
  ChatAssignment,
  ChatAssignmentSchema,
} from './schemas/chat-assignment.schema';
import {
  ChatConversation,
  ChatConversationSchema,
} from './schemas/chat-conversation.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import {
  ChatParticipant,
  ChatParticipantSchema,
} from './schemas/chat-participant.schema';
import {
  ChatStatusLog,
  ChatStatusLogSchema,
} from './schemas/chat-status-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatConversation.name, schema: ChatConversationSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatParticipant.name, schema: ChatParticipantSchema },
      { name: ChatAssignment.name, schema: ChatAssignmentSchema },
      { name: ChatStatusLog.name, schema: ChatStatusLogSchema },
    ]),
    NotificationsModule,
    AuditModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
