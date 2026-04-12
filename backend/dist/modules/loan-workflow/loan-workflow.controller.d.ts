import { AuthenticatedUser } from '../auth/interfaces';
import { ProcessLoanActionDto } from './dto';
import { LoanWorkflowService } from './loan-workflow.service';
export declare class LoanWorkflowController {
    private readonly loanWorkflowService;
    constructor(loanWorkflowService: LoanWorkflowService);
    getLoanQueue(currentUser: AuthenticatedUser): Promise<import("./interfaces").LoanQueueItem[]>;
    getLoanQueueDetail(currentUser: AuthenticatedUser, loanId: string): Promise<import("./interfaces").LoanQueueDetail>;
    getLoanCustomerProfile(currentUser: AuthenticatedUser, loanId: string): Promise<import("./interfaces").LoanCustomerProfile>;
    processAction(currentUser: AuthenticatedUser, loanId: string, dto: ProcessLoanActionDto): Promise<import("./interfaces").LoanTransitionResult>;
}
