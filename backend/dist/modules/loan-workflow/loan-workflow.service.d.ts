import { Model } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { LoanDocument } from '../loans/schemas/loan.schema';
import { NotificationDocument } from '../notifications/schemas/notification.schema';
import { StaffActivityLogDocument } from '../staff-activity/schemas/staff-activity-log.schema';
import { ProcessLoanActionDto } from './dto';
import { LoanTransitionResult } from './interfaces';
import { LoanWorkflowHistoryDocument } from './schemas/loan-workflow-history.schema';
export declare class LoanWorkflowService {
    private readonly loanModel;
    private readonly workflowHistoryModel;
    private readonly staffActivityLogModel;
    private readonly notificationModel;
    private readonly auditService;
    constructor(loanModel: Model<LoanDocument>, workflowHistoryModel: Model<LoanWorkflowHistoryDocument>, staffActivityLogModel: Model<StaffActivityLogDocument>, notificationModel: Model<NotificationDocument>, auditService: AuditService);
    processAction(currentUser: AuthenticatedUser, loanId: string, dto: ProcessLoanActionDto): Promise<LoanTransitionResult>;
    private ensureStaffAccess;
    private ensureUserCanActAtLevel;
    private resolveTransition;
    private resolveApproveTransition;
    private resolveForwardTransition;
    private assertStatusIn;
    private mapActivityType;
    private buildNotificationTitle;
    private buildNotificationMessage;
}
