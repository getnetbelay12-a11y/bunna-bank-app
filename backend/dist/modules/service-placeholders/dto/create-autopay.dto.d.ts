export declare class CreateAutopayDto {
    provider: 'water' | 'electricity' | 'school_payment' | 'rent' | 'employee_salary' | 'transfer_to_savings';
    accountId: string;
    schedule: string;
}
