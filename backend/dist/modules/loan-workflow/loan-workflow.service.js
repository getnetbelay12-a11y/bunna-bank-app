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
exports.LoanWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const constants_1 = require("../../common/constants");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const staff_activity_log_schema_1 = require("../staff-activity/schemas/staff-activity-log.schema");
const loan_workflow_history_schema_1 = require("./schemas/loan-workflow-history.schema");
let LoanWorkflowService = class LoanWorkflowService {
    constructor(loanModel, workflowHistoryModel, staffActivityLogModel, notificationModel, auditService) {
        this.loanModel = loanModel;
        this.workflowHistoryModel = workflowHistoryModel;
        this.staffActivityLogModel = staffActivityLogModel;
        this.notificationModel = notificationModel;
        this.auditService = auditService;
    }
    async processAction(currentUser, loanId, dto) {
        this.ensureStaffAccess(currentUser);
        const loan = await this.loanModel.findById(loanId);
        if (!loan) {
            throw new common_1.NotFoundException('Loan not found.');
        }
        this.ensureUserCanActAtLevel(currentUser, loan.currentLevel);
        const previousStatus = loan.status;
        const previousLevel = loan.currentLevel;
        const transition = this.resolveTransition(loan, dto.action);
        loan.status = transition.status;
        loan.currentLevel = transition.level;
        if (transition.clearAssignment) {
            loan.assignedToStaffId = undefined;
        }
        await loan.save();
        await this.workflowHistoryModel.create({
            loanId: loan._id,
            action: dto.action,
            level: previousLevel,
            fromStatus: previousStatus,
            toStatus: transition.status,
            actorId: new mongoose_2.Types.ObjectId(currentUser.sub),
            actorRole: currentUser.role,
            comment: dto.comment,
        });
        await this.staffActivityLogModel.create({
            staffId: new mongoose_2.Types.ObjectId(currentUser.sub),
            memberId: loan.memberId,
            branchId: loan.branchId,
            districtId: loan.districtId,
            activityType: this.mapActivityType(dto.action),
            referenceType: 'loan',
            referenceId: loan._id,
            amount: loan.amount,
        });
        await this.notificationModel.create({
            userType: 'member',
            userId: loan.memberId,
            type: enums_1.NotificationType.LOAN_STATUS,
            status: 'sent',
            title: this.buildNotificationTitle(transition.status),
            message: this.buildNotificationMessage(transition.status, transition.level),
            entityType: 'loan',
            entityId: loan._id,
        });
        await this.auditService.log({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: `loan_${dto.action}`,
            entityType: 'loan',
            entityId: loan._id.toString(),
            before: {
                status: previousStatus,
                currentLevel: previousLevel,
            },
            after: {
                status: transition.status,
                currentLevel: transition.level,
            },
        });
        return {
            loanId: loan._id.toString(),
            previousStatus,
            status: transition.status,
            currentLevel: transition.level,
        };
    }
    ensureStaffAccess(currentUser) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only staff users can process loan workflow.');
        }
    }
    ensureUserCanActAtLevel(currentUser, level) {
        const roleMap = {
            [enums_1.LoanWorkflowLevel.MEMBER]: [],
            [enums_1.LoanWorkflowLevel.BRANCH]: [enums_1.UserRole.LOAN_OFFICER, enums_1.UserRole.BRANCH_MANAGER],
            [enums_1.LoanWorkflowLevel.DISTRICT]: [
                enums_1.UserRole.DISTRICT_OFFICER,
                enums_1.UserRole.DISTRICT_MANAGER,
            ],
            [enums_1.LoanWorkflowLevel.HEAD_OFFICE]: [
                enums_1.UserRole.HEAD_OFFICE_OFFICER,
                enums_1.UserRole.HEAD_OFFICE_MANAGER,
                enums_1.UserRole.ADMIN,
            ],
        };
        if (!roleMap[level].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('User cannot process loans at this workflow level.');
        }
    }
    resolveTransition(loan, action) {
        if (loan.status === enums_1.LoanStatus.REJECTED && action !== enums_1.LoanAction.CLOSE) {
            throw new common_1.BadRequestException('Rejected loans cannot be processed further.');
        }
        if (loan.status === enums_1.LoanStatus.APPROVED && action === enums_1.LoanAction.REJECT) {
            throw new common_1.BadRequestException('Approved loans cannot be rejected.');
        }
        switch (action) {
            case enums_1.LoanAction.REVIEW:
                this.assertStatusIn(loan.status, [enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW, enums_1.LoanStatus.DISTRICT_REVIEW, enums_1.LoanStatus.HEAD_OFFICE_REVIEW]);
                return { status: loan.status, level: loan.currentLevel };
            case enums_1.LoanAction.APPROVE:
                return this.resolveApproveTransition(loan);
            case enums_1.LoanAction.REJECT:
                this.assertStatusIn(loan.status, [
                    enums_1.LoanStatus.SUBMITTED,
                    enums_1.LoanStatus.BRANCH_REVIEW,
                    enums_1.LoanStatus.DISTRICT_REVIEW,
                    enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
                ]);
                return { status: enums_1.LoanStatus.REJECTED, level: loan.currentLevel, clearAssignment: true };
            case enums_1.LoanAction.FORWARD:
                return this.resolveForwardTransition(loan);
            case enums_1.LoanAction.RETURN_FOR_CORRECTION:
                this.assertStatusIn(loan.status, [
                    enums_1.LoanStatus.SUBMITTED,
                    enums_1.LoanStatus.BRANCH_REVIEW,
                    enums_1.LoanStatus.DISTRICT_REVIEW,
                    enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
                ]);
                return { status: enums_1.LoanStatus.SUBMITTED, level: enums_1.LoanWorkflowLevel.BRANCH, clearAssignment: true };
            case enums_1.LoanAction.DISBURSE:
                if (loan.status !== enums_1.LoanStatus.APPROVED) {
                    throw new common_1.BadRequestException('Loan must be approved before disbursement.');
                }
                return { status: enums_1.LoanStatus.DISBURSED, level: loan.currentLevel };
            case enums_1.LoanAction.CLOSE:
                this.assertStatusIn(loan.status, [enums_1.LoanStatus.DISBURSED, enums_1.LoanStatus.REJECTED]);
                return { status: enums_1.LoanStatus.CLOSED, level: loan.currentLevel, clearAssignment: true };
            default:
                throw new common_1.BadRequestException('Unsupported loan workflow action.');
        }
    }
    resolveApproveTransition(loan) {
        this.assertStatusIn(loan.status, [
            enums_1.LoanStatus.SUBMITTED,
            enums_1.LoanStatus.BRANCH_REVIEW,
            enums_1.LoanStatus.DISTRICT_REVIEW,
            enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
        ]);
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.BRANCH && loan.amount > constants_1.BRANCH_MAX_APPROVAL_AMOUNT) {
            throw new common_1.BadRequestException('Branch level cannot approve loans above the branch threshold.');
        }
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.DISTRICT && loan.amount > constants_1.BRANCH_MAX_APPROVAL_AMOUNT) {
            throw new common_1.BadRequestException('District level must forward high-value loans to head office.');
        }
        return {
            status: enums_1.LoanStatus.APPROVED,
            level: loan.currentLevel,
            clearAssignment: true,
        };
    }
    resolveForwardTransition(loan) {
        this.assertStatusIn(loan.status, [enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW, enums_1.LoanStatus.DISTRICT_REVIEW]);
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.BRANCH) {
            return {
                status: enums_1.LoanStatus.DISTRICT_REVIEW,
                level: enums_1.LoanWorkflowLevel.DISTRICT,
                clearAssignment: true,
            };
        }
        if (loan.currentLevel === enums_1.LoanWorkflowLevel.DISTRICT) {
            return {
                status: enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
                level: enums_1.LoanWorkflowLevel.HEAD_OFFICE,
                clearAssignment: true,
            };
        }
        throw new common_1.BadRequestException('Loan cannot be forwarded from the current workflow level.');
    }
    assertStatusIn(status, allowed) {
        if (!allowed.includes(status)) {
            throw new common_1.BadRequestException('Invalid loan state transition.');
        }
    }
    mapActivityType(action) {
        switch (action) {
            case enums_1.LoanAction.APPROVE:
                return enums_1.ActivityType.LOAN_APPROVED;
            case enums_1.LoanAction.REJECT:
                return enums_1.ActivityType.LOAN_REJECTED;
            case enums_1.LoanAction.FORWARD:
                return enums_1.ActivityType.LOAN_FORWARDED;
            default:
                return enums_1.ActivityType.LOAN_REVIEWED;
        }
    }
    buildNotificationTitle(status) {
        switch (status) {
            case enums_1.LoanStatus.APPROVED:
                return 'Loan Approved';
            case enums_1.LoanStatus.REJECTED:
                return 'Loan Rejected';
            case enums_1.LoanStatus.DISBURSED:
                return 'Loan Disbursed';
            case enums_1.LoanStatus.CLOSED:
                return 'Loan Closed';
            default:
                return 'Loan Status Updated';
        }
    }
    buildNotificationMessage(status, level) {
        if (status === enums_1.LoanStatus.DISTRICT_REVIEW) {
            return 'Your loan has moved to district review.';
        }
        if (status === enums_1.LoanStatus.HEAD_OFFICE_REVIEW) {
            return 'Your loan has moved to head office review.';
        }
        if (status === enums_1.LoanStatus.SUBMITTED) {
            return 'Your loan has been returned for correction and resubmission.';
        }
        return `Your loan is now ${status} at ${level} level.`;
    }
};
exports.LoanWorkflowService = LoanWorkflowService;
exports.LoanWorkflowService = LoanWorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(loan_workflow_history_schema_1.LoanWorkflowHistory.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_activity_log_schema_1.StaffActivityLog.name)),
    __param(3, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService])
], LoanWorkflowService);
//# sourceMappingURL=loan-workflow.service.js.map