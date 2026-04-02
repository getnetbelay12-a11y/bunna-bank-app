"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const storage_service_1 = require("../../common/storage/storage.service");
const audit_service_1 = require("../audit/audit.service");
const loan_workflow_history_schema_1 = require("../loan-workflow/schemas/loan-workflow-history.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const create_loan_document_dto_1 = require("./dto/create-loan-document.dto");
const loan_document_schema_1 = require("./schemas/loan-document.schema");
const loan_schema_1 = require("./schemas/loan.schema");
let LoansService = class LoansService {
    constructor(loanModel, loanDocumentModel, workflowHistoryModel, notificationModel, memberModel, auditService, storageService) {
        this.loanModel = loanModel;
        this.loanDocumentModel = loanDocumentModel;
        this.workflowHistoryModel = workflowHistoryModel;
        this.notificationModel = notificationModel;
        this.memberModel = memberModel;
        this.auditService = auditService;
        this.storageService = storageService;
    }
    async submitLoanApplication(currentUser, dto) {
        this.ensureMemberAccess(currentUser);
        const member = await this.memberModel.findById(currentUser.sub).lean();
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        const loan = await this.loanModel.create({
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            branchId: member.branchId,
            districtId: member.districtId,
            loanType: dto.loanType,
            amount: dto.amount,
            interestRate: dto.interestRate,
            termMonths: dto.termMonths,
            purpose: dto.purpose,
            status: enums_1.LoanStatus.SUBMITTED,
            currentLevel: enums_1.LoanWorkflowLevel.BRANCH,
            assignedToStaffId: dto.assignedToStaffId
                ? new mongoose_2.Types.ObjectId(dto.assignedToStaffId)
                : undefined,
        });
        const documents = await this.createLoanDocuments(loan._id, new mongoose_2.Types.ObjectId(currentUser.sub), dto.documents ?? []);
        await this.workflowHistoryModel.create({
            loanId: loan._id,
            action: enums_1.LoanAction.SUBMIT,
            level: enums_1.LoanWorkflowLevel.MEMBER,
            fromStatus: enums_1.LoanStatus.DRAFT,
            toStatus: enums_1.LoanStatus.SUBMITTED,
            actorId: new mongoose_2.Types.ObjectId(currentUser.sub),
            actorRole: currentUser.role,
            comment: 'Loan application submitted by member.',
        });
        await this.notificationModel.create({
            userType: 'member',
            userId: new mongoose_2.Types.ObjectId(currentUser.sub),
            userRole: currentUser.role,
            type: enums_1.NotificationType.LOAN_STATUS,
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
                status: enums_1.LoanStatus.SUBMITTED,
                currentLevel: enums_1.LoanWorkflowLevel.BRANCH,
                amount: dto.amount,
            },
        });
        return {
            loan: this.toLoanDetail(loan),
            documentIds: documents.map((document) => document._id.toString()),
        };
    }
    async attachLoanDocument(currentUser, loanId, dto) {
        this.ensureMemberAccess(currentUser);
        const loan = await this.loanModel.findById(loanId).lean();
        if (!loan || loan.memberId.toString() !== currentUser.sub) {
            throw new common_1.NotFoundException('Loan not found.');
        }
        const [document] = await this.createLoanDocuments(new mongoose_2.Types.ObjectId(loanId), new mongoose_2.Types.ObjectId(currentUser.sub), [dto]);
        return {
            id: document._id.toString(),
            loanId,
            documentType: document.documentType,
            originalFileName: document.originalFileName,
            storageKey: document.storageKey,
        };
    }
    async getMyLoans(currentUser) {
        this.ensureMemberAccess(currentUser);
        const loans = await this.loanModel
            .find({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) })
            .sort({ createdAt: -1 })
            .lean();
        return loans.map((loan) => this.toLoanDetail(loan));
    }
    async getLoanDetail(currentUser, loanId) {
        this.ensureMemberAccess(currentUser);
        const loan = await this.loanModel.findById(loanId).lean();
        if (!loan || loan.memberId.toString() !== currentUser.sub) {
            throw new common_1.NotFoundException('Loan not found.');
        }
        return this.toLoanDetail(loan);
    }
    async createLoanDocuments(loanId, memberId, documents) {
        if (documents.length === 0) {
            return [];
        }
        this.validateLoanDocuments(documents);
        const preparedDocuments = await Promise.all(documents.map(async (document) => {
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
        }));
        return this.loanDocumentModel.create(preparedDocuments);
    }
    validateLoanDocuments(documents) {
        if (documents.length > create_loan_document_dto_1.MAX_LOAN_DOCUMENTS) {
            throw new common_1.BadRequestException(`A loan application can include at most ${create_loan_document_dto_1.MAX_LOAN_DOCUMENTS} documents.`);
        }
        for (const document of documents) {
            if (document.sizeBytes != null && document.sizeBytes > create_loan_document_dto_1.MAX_LOAN_DOCUMENT_SIZE_BYTES) {
                throw new common_1.BadRequestException(`Document ${document.originalFileName} exceeds the ${create_loan_document_dto_1.MAX_LOAN_DOCUMENT_SIZE_BYTES} byte limit.`);
            }
            if (document.storageKey?.includes('..')) {
                throw new common_1.BadRequestException('Document storageKey must not contain path traversal segments.');
            }
        }
    }
    ensureMemberAccess(currentUser) {
        if (currentUser.role !== enums_1.UserRole.MEMBER &&
            currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only members can access loan application endpoints.');
        }
    }
    toLoanDetail(loan) {
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
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(loan_document_schema_1.LoanDocumentMetadata.name)),
    __param(2, (0, mongoose_1.InjectModel)(loan_workflow_history_schema_1.LoanWorkflowHistory.name)),
    __param(3, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(4, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        storage_service_1.StorageService])
], LoansService);
//# sourceMappingURL=loans.service.js.map