import { CreateLoanDocumentDto } from './create-loan-document.dto';
export declare class CreateLoanApplicationDto {
    loanType: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    assignedToStaffId?: string;
    documents?: CreateLoanDocumentDto[];
}
