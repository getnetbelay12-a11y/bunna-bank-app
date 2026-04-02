import { Model } from 'mongoose';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { LoanWorkflowHistoryDocument } from '../loan-workflow/schemas/loan-workflow-history.schema';
import { MemberDocument } from '../members/schemas/member.schema';
import { NotificationDocument } from '../notifications/schemas/notification.schema';
import { AttachLoanDocumentDto, CreateLoanApplicationDto } from './dto';
import { LoanDetail, LoanSubmissionResult } from './interfaces';
import { LoanDocumentMetadataDocument } from './schemas/loan-document.schema';
import { LoanDocument } from './schemas/loan.schema';
export declare class LoansService {
    private readonly loanModel;
    private readonly loanDocumentModel;
    private readonly workflowHistoryModel;
    private readonly notificationModel;
    private readonly memberModel;
    private readonly auditService;
    private readonly storageService;
    constructor(loanModel: Model<LoanDocument>, loanDocumentModel: Model<LoanDocumentMetadataDocument>, workflowHistoryModel: Model<LoanWorkflowHistoryDocument>, notificationModel: Model<NotificationDocument>, memberModel: Model<MemberDocument>, auditService: AuditService, storageService: StorageService);
    submitLoanApplication(currentUser: AuthenticatedUser, dto: CreateLoanApplicationDto): Promise<LoanSubmissionResult>;
    attachLoanDocument(currentUser: AuthenticatedUser, loanId: string, dto: AttachLoanDocumentDto): Promise<{
        id: string;
        loanId: string;
        documentType: string;
        originalFileName: string;
        storageKey: string;
    }>;
    getMyLoans(currentUser: AuthenticatedUser): Promise<LoanDetail[]>;
    getLoanDetail(currentUser: AuthenticatedUser, loanId: string): Promise<LoanDetail>;
    private createLoanDocuments;
    private validateLoanDocuments;
    private ensureMemberAccess;
    private toLoanDetail;
}
