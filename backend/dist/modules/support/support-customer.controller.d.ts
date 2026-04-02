import { AuthenticatedUser } from '../auth/interfaces';
import { CreateChatConversationDto, CreateChatMessageDto } from '../chat/dto';
import { ChatService } from '../chat/chat.service';
export declare class SupportCustomerController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listMyConversations(currentUser: AuthenticatedUser): Promise<import("../chat/interfaces").ChatConversationResult[]>;
    createConversation(currentUser: AuthenticatedUser, dto: CreateChatConversationDto): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
    getConversation(currentUser: AuthenticatedUser, conversationId: string): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
    sendMessage(currentUser: AuthenticatedUser, conversationId: string, dto: CreateChatMessageDto): Promise<import("../chat/interfaces").ChatConversationDetailResult>;
}
