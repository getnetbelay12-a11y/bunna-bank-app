import { LoanWorkflowLevel, LoanStatus } from '../../../common/enums';
export interface LoanDetail {
    id: string;
    memberId: string;
    branchId: string;
    districtId: string;
    loanType: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    status: LoanStatus;
    currentLevel: LoanWorkflowLevel;
    assignedToStaffId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface LoanSubmissionResult {
    loan: LoanDetail;
    documentIds: string[];
}
