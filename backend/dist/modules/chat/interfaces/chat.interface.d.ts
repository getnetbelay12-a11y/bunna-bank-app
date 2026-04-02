export interface ChatMessageResult {
    id: string;
    conversationId: string;
    senderType: 'customer' | 'agent' | 'system';
    senderId?: string;
    senderName?: string;
    message: string;
    messageType: 'text' | 'system';
    createdAt?: Date;
    readAt?: Date;
}
export interface ChatConversationResult {
    id: string;
    conversationId: string;
    memberId: string;
    customerId: string;
    memberName?: string;
    phoneNumber?: string;
    memberType: string;
    branchId?: string;
    branchName?: string;
    districtId?: string;
    districtName?: string;
    assignedToStaffId?: string;
    assignedToStaffName?: string;
    assignedAgentId?: string;
    status: 'open' | 'assigned' | 'waiting_customer' | 'waiting_agent' | 'resolved' | 'closed';
    channel: 'mobile';
    category: string;
    issueCategory: string;
    priority: 'low' | 'normal' | 'high';
    escalationFlag: boolean;
    lastMessageAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    latestMessage?: ChatMessageResult;
}
export interface ChatConversationDetailResult extends ChatConversationResult {
    messages: ChatMessageResult[];
}
