import { IsIn, IsString } from 'class-validator';

export class CreateAutopayDto {
  @IsIn([
    'water',
    'electricity',
    'school_payment',
    'rent',
    'employee_salary',
    'transfer_to_savings',
  ])
  provider!:
    | 'water'
    | 'electricity'
    | 'school_payment'
    | 'rent'
    | 'employee_salary'
    | 'transfer_to_savings';

  @IsString()
  accountId!: string;

  @IsString()
  schedule!: string;
}
