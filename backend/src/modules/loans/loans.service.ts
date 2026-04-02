import {
  BadRequestException,
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
  NotificationType,
  UserRole,
} from '../../common/enums';
import { StorageService } from '../../common/storage/storage.service';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { LoanWorkflowHistory, LoanWorkflowHistoryDocument } from '../loan-workflow/schemas/loan-workflow-history.schema';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import {
  AttachLoanDocumentDto,
  CreateLoanApplicationDto,
  CreateLoanDocumentDto,
} from './dto';
import {
  MAX_LOAN_DOCUMENT_SIZE_BYTES,
  MAX_LOAN_DOCUMENTS,
} from './dto/create-loan-document.dto';
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
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly auditService: AuditService,
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

    await this.notificationModel.create({
      userType: 'member',
      userId: new Types.ObjectId(currentUser.sub),
      userRole: currentUser.role,
      type: NotificationType.LOAN_STATUS,
      status: 'sent',
      title: 'Loan Application Submitted',
      message: 'Your loan application has been submitted successfully.',
      entityType: 'loan',
      entityId: loan._id,
    });

    await this.auditService.log({
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

  private async createLoanDocuments(
    loanId: Types.ObjectId,
    memberId: Types.ObjectId,
    documents: CreateLoanDocumentDto[],
  ) {
    if (documents.length === 0) {
      return [];
    }

    this.validateLoanDocuments(documents);

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

  private validateLoanDocuments(documents: CreateLoanDocumentDto[]) {
    if (documents.length > MAX_LOAN_DOCUMENTS) {
      throw new BadRequestException(
        `A loan application can include at most ${MAX_LOAN_DOCUMENTS} documents.`,
      );
    }

    for (const document of documents) {
      if (document.sizeBytes != null && document.sizeBytes > MAX_LOAN_DOCUMENT_SIZE_BYTES) {
        throw new BadRequestException(
          `Document ${document.originalFileName} exceeds the ${MAX_LOAN_DOCUMENT_SIZE_BYTES} byte limit.`,
        );
      }

      if (document.storageKey?.includes('..')) {
        throw new BadRequestException('Document storageKey must not contain path traversal segments.');
      }
    }
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
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
