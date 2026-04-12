import { LoanAction } from '../../../common/enums';
export declare class ProcessLoanActionDto {
    action: LoanAction;
    comment?: string;
    deficiencyReasons?: string[];
}
