import { AuthenticatedUser } from '../auth/interfaces';
import { ProcessLoanActionDto } from './dto';
import { LoanWorkflowService } from './loan-workflow.service';
export declare class LoanWorkflowController {
    private readonly loanWorkflowService;
    constructor(loanWorkflowService: LoanWorkflowService);
    processAction(currentUser: AuthenticatedUser, loanId: string, dto: ProcessLoanActionDto): Promise<import("./interfaces").LoanTransitionResult>;
}
