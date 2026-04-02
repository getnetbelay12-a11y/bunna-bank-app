import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateChatConversationDto, CreateChatMessageDto } from './dto';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MEMBER, UserRole.SHAREHOLDER_MEMBER)
@Controller('chat/conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  listMyConversations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listMyConversations(currentUser);
  }

  @Post()
  createConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateChatConversationDto,
  ) {
    return this.chatService.createConversation(currentUser, dto);
  }

  @Get(':conversationId')
  getConversation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getMyConversation(currentUser, conversationId);
  }

  @Post(':conversationId/messages')
  sendMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateChatMessageDto,
  ) {
    return this.chatService.sendCustomerMessage(
      currentUser,
      conversationId,
      dto,
    );
  }
}
