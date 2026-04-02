import { IsBoolean } from 'class-validator';

export class UpdateAccountLockDto {
  @IsBoolean()
  enabled!: boolean;
}

