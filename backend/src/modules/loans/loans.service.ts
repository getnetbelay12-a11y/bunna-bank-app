import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LoanAction,
  LoanStatus,
  LoanWorkflowLevel,
  NotificationStatus,
  NotificationType,
  UserRole,
} from '../../common/enums';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { LoanWorkflowHistory, LoanWorkflowHistoryDocument } from '../loan-workflow/schemas/loan-workflow-history.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { buildLoanSubmissionNotification } from '../notifications/banking-notification-builders';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AttachLoanDocumentDto,
  CreateLoanApplicationDto,
  CreateLoanDocumentDto,
} from './dto';
import { LoanDetail, LoanSubmissionResult } from './interfaces';
import { LoanDocumentMetadata, LoanDocumentMetadataDocument } from './schemas/loan-document.schema';
import { Loan, LoanDocument } from './schemas/loan.schema';

@Injectable()
export class LoansService {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<LoanDocument>,
    @InjectModel(LoanDocumentMetadata.name)
    private readonly loanDocumentModel: Model<LoanDocumentMetadataDocument>,
    @InjectModel(LoanWorkflowHistory.name)
    private readonly workflowHistoryModel: Model<LoanWorkflowHistoryDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly storageService: StorageService,
  ) {}

  async submitLoanApplication(
    currentUser: AuthenticatedUser,
    dto: CreateLoanApplicationDto,
  ): Promise<LoanSubmissionResult> {
    this.ensureMemberAccess(currentUser);

    const member = await this.memberModel.findById(currentUser.sub).lean<MemberDocument | null>();

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    const loan = await this.loanModel.create({
      memberId: new Types.ObjectId(currentUser.sub),
      branchId: member.branchId,
      districtId: member.districtId,
      loanType: dto.loanType,
      amount: dto.amount,
      interestRate: dto.interestRate,
      termMonths: dto.termMonths,
      purpose: dto.purpose,
      status: LoanStatus.SUBMITTED,
      currentLevel: LoanWorkflowLevel.BRANCH,
      assignedToStaffId: dto.assignedToStaffId
        ? new Types.ObjectId(dto.assignedToStaffId)
        : undefined,
    });

    const documents = await this.createLoanDocuments(
      loan._id,
      new Types.ObjectId(currentUser.sub),
      dto.documents ?? [],
    );

    await this.workflowHistoryModel.create({
      loanId: loan._id,
      action: LoanAction.SUBMIT,
      level: LoanWorkflowLevel.MEMBER,
      fromStatus: LoanStatus.DRAFT,
      toStatus: LoanStatus.SUBMITTED,
      actorId: new Types.ObjectId(currentUser.sub),
      actorRole: currentUser.role,
      comment: 'Loan application submitted by member.',
    });

    const notification = buildLoanSubmissionNotification();

    await this.notificationsService.createNotification({
      userType: 'member',
      userId: currentUser.sub,
      userRole: currentUser.role,
      type: notification.type,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      entityType: 'loan',
      entityId: loan._id.toString(),
      actionLabel: 'Open loan',
      priority: 'normal',
      deepLink: `/loans/${loan._id.toString()}`,
    });

    await this.auditService.logActorAction({
      actorId: currentUser.sub,
      actorRole: currentUser.role,
      actionType: 'loan_submitted',
      entityType: 'loan',
      entityId: loan._id.toString(),
      before: null,
      after: {
        status: LoanStatus.SUBMITTED,
        currentLevel: LoanWorkflowLevel.BRANCH,
        amount: dto.amount,
      },
    });

    return {
      loan: this.toLoanDetail(loan),
      documentIds: documents.map((document) => document._id.toString()),
    };
  }

  async attachLoanDocument(
    currentUser: AuthenticatedUser,
    loanId: string,
    dto: AttachLoanDocumentDto,
  ) {
    this.ensureMemberAccess(currentUser);

    const loan = await this.loanModel.findById(loanId).lean<LoanDocument | null>();

    if (!loan || loan.memberId.toString() !== currentUser.sub) {
      throw new NotFoundException('Loan not found.');
    }

    const [document] = await this.createLoanDocuments(
      new Types.ObjectId(loanId),
      new Types.ObjectId(currentUser.sub),
      [dto],
    );

    return {
      id: document._id.toString(),
      loanId,
      documentType: document.documentType,
      originalFileName: document.originalFileName,
      storageKey: document.storageKey,
    };
  }

  async getMyLoans(currentUser: AuthenticatedUser): Promise<LoanDetail[]> {
    this.ensureMemberAccess(currentUser);

    const loans = await this.loanModel
      .find({ memberId: new Types.ObjectId(currentUser.sub) })
      .sort({ createdAt: -1 })
      .lean<LoanDocument[]>();

    return loans.map((loan) => this.toLoanDetail(loan));
  }

  async getLoanDetail(
    currentUser: AuthenticatedUser,
    loanId: string,
  ): Promise<LoanDetail> {
    this.ensureMemberAccess(currentUser);

    const loan = await this.loanModel.findById(loanId).lean<LoanDocument | null>();

    if (!loan || loan.memberId.toString() !== currentUser.sub) {
      throw new NotFoundException('Loan not found.');
    }

    return this.toLoanDetail(loan);
  }

  async getLoanTimeline(currentUser: AuthenticatedUser, loanId: string) {
    this.ensureMemberAccess(currentUser);

    const loan = await this.loanModel.findById(loanId).lean<LoanDocument | null>();

    if (!loan || loan.memberId.toString() !== currentUser.sub) {
      throw new NotFoundException('Loan not found.');
    }

    const deficiencyReasons = loan.deficiencyReasons ?? [];

    return {
      loanId,
      timeline: [
        {
          status: 'submitted',
          title: 'Submitted',
          description: 'Your application was received and entered into the review queue.',
          isCompleted: true,
        },
        {
          status: 'branch_review',
          title: 'Branch Review',
          description:
            deficiencyReasons.length > 0 && loan.currentLevel === LoanWorkflowLevel.BRANCH
              ? `Branch review needs more evidence: ${deficiencyReasons.join(', ')}.`
              : 'Branch team is validating the application package and first-line controls.',
          isCompleted:
            loan.currentLevel !== LoanWorkflowLevel.BRANCH ||
            ![LoanStatus.SUBMITTED, LoanStatus.BRANCH_REVIEW].includes(loan.status),
        },
        {
          status: 'district_review',
          title: 'District Review',
          description:
            deficiencyReasons.length > 0 && loan.currentLevel === LoanWorkflowLevel.DISTRICT
              ? `District review is waiting on: ${deficiencyReasons.join(', ')}.`
              : 'District review applies for escalated or higher-value cases.',
          isCompleted:
            loan.currentLevel === LoanWorkflowLevel.HEAD_OFFICE ||
            [
              LoanStatus.APPROVED,
              LoanStatus.DISBURSED,
              LoanStatus.CLOSED,
              LoanStatus.REJECTED,
            ].includes(
              loan.status,
            ),
        },
        {
          status: 'head_office_review',
          title: 'Head Office Review',
          description:
            loan.currentLevel === LoanWorkflowLevel.HEAD_OFFICE
              ? 'Head office credit control is reviewing final approval and disbursement readiness.'
              : 'Head office review is only required for higher-risk or escalated applications.',
          isCompleted: [
            LoanStatus.APPROVED,
            LoanStatus.DISBURSED,
            LoanStatus.CLOSED,
            LoanStatus.REJECTED,
          ].includes(loan.status),
        },
        {
          status: 'need_documents',
          title: 'Need Documents',
          description:
            deficiencyReasons.length > 0
              ? `Customer action is required before approval: ${deficiencyReasons.join(', ')}.`
              : 'No missing documents are blocking this application right now.',
          isCompleted: deficiencyReasons.length === 0,
        },
        {
          status: 'approved',
          title: 'Approved',
          description:
            loan.status === LoanStatus.APPROVED || loan.status === LoanStatus.DISBURSED
              ? 'The loan is approved. Watch disbursement and repayment reminders.'
              : 'Approval is still pending while the review team completes its checks.',
          isCompleted: [
            LoanStatus.APPROVED,
            LoanStatus.DISBURSED,
            LoanStatus.CLOSED,
          ].includes(loan.status),
        },
        {
          status: 'rejected',
          title: 'Rejected',
          description:
            loan.status === LoanStatus.REJECTED
              ? 'The application was rejected. Contact support or submit a new package after correcting the identified issues.'
              : 'Rejected only appears if the loan cannot proceed after review.',
          isCompleted: loan.status === LoanStatus.REJECTED,
        },
        {
          status: 'disbursed',
          title: 'Disbursed',
          description:
            loan.status === LoanStatus.DISBURSED
              ? 'Funds have been released. Repayment and insurance reminders will continue in your notification center.'
              : 'Disbursement happens after approval, verification, and final operations checks.',
          isCompleted: [LoanStatus.DISBURSED, LoanStatus.CLOSED].includes(loan.status),
        },
      ],
    };
  }

  private async createLoanDocuments(
    loanId: Types.ObjectId,
    memberId: Types.ObjectId,
    documents: CreateLoanDocumentDto[],
  ) {
    if (documents.length === 0) {
      return [];
    }

    const preparedDocuments = await Promise.all(
      documents.map(async (document) => {
        const storedDocument = document.storageKey
          ? {
              storageKey: document.storageKey,
            }
          : await this.storageService.registerDocument({
              domain: 'loans',
              entityId: loanId.toString(),
              originalFileName: document.originalFileName,
              payload: {
                loanId: loanId.toString(),
                memberId: memberId.toString(),
                documentType: document.documentType,
                mimeType: document.mimeType,
                sizeBytes: document.sizeBytes,
              },
            });

        return {
          loanId,
          memberId,
          documentType: document.documentType,
          originalFileName: document.originalFileName,
          storageKey: storedDocument.storageKey,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
        };
      }),
    );

    return this.loanDocumentModel.create(preparedDocuments);
  }

  private ensureMemberAccess(currentUser: AuthenticatedUser): void {
    if (
      currentUser.role !== UserRole.MEMBER &&
      currentUser.role !== UserRole.SHAREHOLDER_MEMBER
    ) {
      throw new ForbiddenException('Only members can access loan application endpoints.');
    }
  }

  private toLoanDetail(loan: LoanDocument & { id?: string }): LoanDetail {
    return {
      id: loan.id ?? loan._id.toString(),
      memberId: loan.memberId.toString(),
      branchId: loan.branchId.toString(),
      districtId: loan.districtId.toString(),
      loanType: loan.loanType,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      purpose: loan.purpose,
      status: loan.status,
      currentLevel: loan.currentLevel,
      assignedToStaffId: loan.assignedToStaffId?.toString(),
      deficiencyReasons: loan.deficiencyReasons ?? [],
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
