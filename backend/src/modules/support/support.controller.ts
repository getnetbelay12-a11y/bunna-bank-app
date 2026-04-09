import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AuthenticatedUser } from '../auth/interfaces';
import { CreateChatMessageDto } from '../chat/dto';
import { ChatService } from '../chat/chat.service';
import { AssignChatDto, UpdateChatStatusDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPPORT_AGENT,
  UserRole.ADMIN,
  UserRole.DISTRICT_OFFICER,
  UserRole.DISTRICT_MANAGER,
  UserRole.HEAD_OFFICE_OFFICER,
  UserRole.HEAD_OFFICE_MANAGER,
  UserRole.BRANCH_MANAGER,
)
@Controller('support/console/chats')
export class SupportController {
  constructor(private readonly chatService: ChatService) {}

  @Get('open')
  getOpenChats(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listOpenChats(currentUser);
  }

  @Get('assigned')
  getAssignedChats(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listAssignedChats(currentUser);
  }

  @Get('resolved')
  getResolvedChats(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.chatService.listResolvedChats(currentUser);
  }

  @Get(':conversationId')
  getChat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getSupportConversation(currentUser, conversationId);
  }

  @Post(':conversationId/assign')
  assignChat(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: AssignChatDto,
  ) {
    return this.chatService.assignConversation(
      currentUser,
      conversationId,
      dto.agentId,
    );
  }

  @Post(':conversationId/messages')
  reply(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateChatMessageDto,
  ) {
    return this.chatService.replyAsAgent(currentUser, conversationId, dto);
  }

  @Patch(':conversationId/status')
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateChatStatusDto,
  ) {
    return this.chatService.updateSupportConversationStatus(
      currentUser,
      conversationId,
      dto.status,
    );
  }
}
