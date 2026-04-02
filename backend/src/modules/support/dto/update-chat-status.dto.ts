import { IsEnum } from 'class-validator';

export class UpdateChatStatusDto {
  @IsEnum([
    'assigned',
    'waiting_customer',
    'waiting_agent',
    'resolved',
    'closed',
  ])
  status!:
    | 'assigned'
    | 'waiting_customer'
    | 'waiting_agent'
    | 'resolved'
    | 'closed';
}
