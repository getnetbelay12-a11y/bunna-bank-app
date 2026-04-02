import { IsMongoId, IsOptional } from 'class-validator';

export class AssignChatDto {
  @IsOptional()
  @IsMongoId()
  agentId?: string;
}
