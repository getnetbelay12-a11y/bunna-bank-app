export declare enum ChatIssueCategory {
    LOAN_ISSUE = "loan_issue",
    PAYMENT_ISSUE = "payment_issue",
    INSURANCE_ISSUE = "insurance_issue",
    KYC_ISSUE = "kyc_issue",
    GENERAL_HELP = "general_help"
}
export declare class CreateChatConversationDto {
    issueCategory: ChatIssueCategory;
    loanId?: string;
    initialMessage?: string;
}
