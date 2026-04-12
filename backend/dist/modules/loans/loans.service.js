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
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const notifications_service_1 = require("../notifications/notifications.service");
const loan_document_schema_1 = require("./schemas/loan-document.schema");
const loan_schema_1 = require("./schemas/loan.schema");
let LoansService = class LoansService {
    constructor(loanModel, loanDocumentModel, workflowHistoryModel, memberModel, auditService, notificationsService, storageService) {
        this.loanModel = loanModel;
        this.loanDocumentModel = loanDocumentModel;
        this.workflowHistoryModel = workflowHistoryModel;
        this.memberModel = memberModel;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
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
        const notification = (0, banking_notification_builders_1.buildLoanSubmissionNotification)();
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
    async getLoanTimeline(currentUser, loanId) {
        this.ensureMemberAccess(currentUser);
        const loan = await this.loanModel.findById(loanId).lean();
        if (!loan || loan.memberId.toString() !== currentUser.sub) {
            throw new common_1.NotFoundException('Loan not found.');
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
                    description: deficiencyReasons.length > 0 && loan.currentLevel === enums_1.LoanWorkflowLevel.BRANCH
                        ? `Branch review needs more evidence: ${deficiencyReasons.join(', ')}.`
                        : 'Branch team is validating the application package and first-line controls.',
                    isCompleted: loan.currentLevel !== enums_1.LoanWorkflowLevel.BRANCH ||
                        ![enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW].includes(loan.status),
                },
                {
                    status: 'district_review',
                    title: 'District Review',
                    description: deficiencyReasons.length > 0 && loan.currentLevel === enums_1.LoanWorkflowLevel.DISTRICT
                        ? `District review is waiting on: ${deficiencyReasons.join(', ')}.`
                        : 'District review applies for escalated or higher-value cases.',
                    isCompleted: loan.currentLevel === enums_1.LoanWorkflowLevel.HEAD_OFFICE ||
                        [
                            enums_1.LoanStatus.APPROVED,
                            enums_1.LoanStatus.DISBURSED,
                            enums_1.LoanStatus.CLOSED,
                            enums_1.LoanStatus.REJECTED,
                        ].includes(loan.status),
                },
                {
                    status: 'head_office_review',
                    title: 'Head Office Review',
                    description: loan.currentLevel === enums_1.LoanWorkflowLevel.HEAD_OFFICE
                        ? 'Head office credit control is reviewing final approval and disbursement readiness.'
                        : 'Head office review is only required for higher-risk or escalated applications.',
                    isCompleted: [
                        enums_1.LoanStatus.APPROVED,
                        enums_1.LoanStatus.DISBURSED,
                        enums_1.LoanStatus.CLOSED,
                        enums_1.LoanStatus.REJECTED,
                    ].includes(loan.status),
                },
                {
                    status: 'need_documents',
                    title: 'Need Documents',
                    description: deficiencyReasons.length > 0
                        ? `Customer action is required before approval: ${deficiencyReasons.join(', ')}.`
                        : 'No missing documents are blocking this application right now.',
                    isCompleted: deficiencyReasons.length === 0,
                },
                {
                    status: 'approved',
                    title: 'Approved',
                    description: loan.status === enums_1.LoanStatus.APPROVED || loan.status === enums_1.LoanStatus.DISBURSED
                        ? 'The loan is approved. Watch disbursement and repayment reminders.'
                        : 'Approval is still pending while the review team completes its checks.',
                    isCompleted: [
                        enums_1.LoanStatus.APPROVED,
                        enums_1.LoanStatus.DISBURSED,
                        enums_1.LoanStatus.CLOSED,
                    ].includes(loan.status),
                },
                {
                    status: 'rejected',
                    title: 'Rejected',
                    description: loan.status === enums_1.LoanStatus.REJECTED
                        ? 'The application was rejected. Contact support or submit a new package after correcting the identified issues.'
                        : 'Rejected only appears if the loan cannot proceed after review.',
                    isCompleted: loan.status === enums_1.LoanStatus.REJECTED,
                },
                {
                    status: 'disbursed',
                    title: 'Disbursed',
                    description: loan.status === enums_1.LoanStatus.DISBURSED
                        ? 'Funds have been released. Repayment and insurance reminders will continue in your notification center.'
                        : 'Disbursement happens after approval, verification, and final operations checks.',
                    isCompleted: [enums_1.LoanStatus.DISBURSED, enums_1.LoanStatus.CLOSED].includes(loan.status),
                },
            ],
        };
    }
    async createLoanDocuments(loanId, memberId, documents) {
        if (documents.length === 0) {
            return [];
        }
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
            deficiencyReasons: loan.deficiencyReasons ?? [],
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
    __param(3, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        storage_service_1.StorageService])
], LoansService);
//# sourceMappingURL=loans.service.js.map