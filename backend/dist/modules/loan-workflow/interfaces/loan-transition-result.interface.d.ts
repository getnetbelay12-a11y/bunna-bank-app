import { LoanWorkflowLevel, LoanStatus } from '../../../common/enums';
export interface LoanTransitionResult {
    loanId: string;
    previousStatus: LoanStatus;
    status: LoanStatus;
    currentLevel: LoanWorkflowLevel;
}
