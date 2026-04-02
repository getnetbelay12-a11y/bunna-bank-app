import { AuthenticatedUser } from '../auth/interfaces';
import { CreateChatMessageDto } from '../chat/dto';
import { ChatService } from '../chat/chat.service';
import { AssignChatDto, UpdateChatStatusDto } from './dto';
export declare class SupportController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getOpenChats(currentUser: AuthenticatedUser): Promise<import("../chat/interfaces").ChatConversationResult[]>;
    getAssignedChats(currentUser: AuthenticatedUser): Promise<import("../chat/interfaces").ChatConversationResult[]>;
    getResolvedChats(currentUser: AuthenticatedUser): Promise<import("../chat/interfaces").ChatConversationResult[]>;
    getChat(currentUser: AuthenticatedUser, conversationId: string): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
    assignChat(currentUser: AuthenticatedUser, conversationId: string, dto: AssignChatDto): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
    reply(currentUser: AuthenticatedUser, conversationId: string, dto: CreateChatMessageDto): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
    updateStatus(currentUser: AuthenticatedUser, conversationId: string, dto: UpdateChatStatusDto): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
}
