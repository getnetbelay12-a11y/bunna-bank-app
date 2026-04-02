import { AuthenticatedUser } from '../auth/interfaces';
import { CreateChatConversationDto, CreateChatMessageDto } from './dto';
import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listMyConversations(currentUser: AuthenticatedUser): Promise<import("./interfaces").ChatConversationResult[]>;
    createConversation(currentUser: AuthenticatedUser, dto: CreateChatConversationDto): Promise<import("./interfaces").ChatConversationDetailResult>;
    getConversation(currentUser: AuthenticatedUser, conversationId: string): Promise<import("./interfaces").ChatConversationDetailResult>;
    sendMessage(currentUser: AuthenticatedUser, conversationId: string, dto: CreateChatMessageDto): Promise<import("./interfaces").ChatConversationDetailResult>;
}
