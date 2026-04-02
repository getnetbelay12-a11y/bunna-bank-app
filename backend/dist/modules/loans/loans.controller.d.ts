import { AuthenticatedUser } from '../auth/interfaces';
import { AttachLoanDocumentDto, CreateLoanApplicationDto } from './dto';
import { LoansService } from './loans.service';
export declare class LoansController {
    private readonly loansService;
    constructor(loansService: LoansService);
    submitLoanApplication(currentUser: AuthenticatedUser, dto: CreateLoanApplicationDto): Promise<import("./interfaces").LoanSubmissionResult>;
    attachLoanDocument(currentUser: AuthenticatedUser, loanId: string, dto: AttachLoanDocumentDto): Promise<{
        id: string;
        loanId: string;
        documentType: string;
        originalFileName: string;
        storageKey: string;
    }>;
    getMyLoans(currentUser: AuthenticatedUser): Promise<import("./interfaces").LoanDetail[]>;
    getLoanDetail(currentUser: AuthenticatedUser, loanId: string): Promise<import("./interfaces").LoanDetail>;
    getLoanTimeline(loanId: string): {
        loanId: string;
        timeline: {
            status: string;
            title: string;
        }[];
    };
}
