import {
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ChatIssueCategory {
  LOAN_ISSUE = 'loan_issue',
  PAYMENT_ISSUE = 'payment_issue',
  INSURANCE_ISSUE = 'insurance_issue',
  KYC_ISSUE = 'kyc_issue',
  GENERAL_HELP = 'general_help',
}

export class CreateChatConversationDto {
  @IsEnum(ChatIssueCategory)
  issueCategory!: ChatIssueCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  loanId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  initialMessage?: string;
}
