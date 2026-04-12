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
const chat_conversation_schema_1 = require("../chat/schemas/chat-conversation.schema");
const loan_schema_1 = require("../loans/schemas/loan.schema");
const member_schema_1 = require("../members/schemas/member.schema");
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const notifications_service_1 = require("../notifications/notifications.service");
const transaction_schema_1 = require("../payments/schemas/transaction.schema");
const autopay_setting_schema_1 = require("../service-placeholders/schemas/autopay-setting.schema");
const staff_activity_log_schema_1 = require("../staff-activity/schemas/staff-activity-log.schema");
const loan_workflow_history_schema_1 = require("./schemas/loan-workflow-history.schema");
let LoanWorkflowService = class LoanWorkflowService {
    constructor(loanModel, memberModel, transactionModel, autopaySettingModel, chatConversationModel, workflowHistoryModel, staffActivityLogModel, auditService, notificationsService) {
        this.loanModel = loanModel;
        this.memberModel = memberModel;
        this.transactionModel = transactionModel;
        this.autopaySettingModel = autopaySettingModel;
        this.chatConversationModel = chatConversationModel;
        this.workflowHistoryModel = workflowHistoryModel;
        this.staffActivityLogModel = staffActivityLogModel;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
    }
    async getLoanQueue(currentUser) {
        this.ensureStaffAccess(currentUser);
        const match = {
            status: {
                $in: [
                    enums_1.LoanStatus.SUBMITTED,
                    enums_1.LoanStatus.BRANCH_REVIEW,
                    enums_1.LoanStatus.DISTRICT_REVIEW,
                    enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
                    enums_1.LoanStatus.APPROVED,
                ],
            },
        };
        if (currentUser.branchId && currentUser.role === enums_1.UserRole.BRANCH_MANAGER) {
            match.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if (currentUser.districtId &&
            [enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role)) {
            match.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const items = await this.loanModel.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'member',
                },
            },
            { $unwind: '$member' },
            {
                $project: {
                    _id: 0,
                    loanId: { $toString: '$_id' },
                    memberId: { $toString: '$memberId' },
                    customerId: '$member.customerId',
                    memberName: '$member.fullName',
                    amount: 1,
                    level: '$currentLevel',
                    status: 1,
                    branchId: { $toString: '$branchId' },
                    districtId: { $toString: '$districtId' },
                    deficiencyReasons: { $ifNull: ['$deficiencyReasons', []] },
                    updatedAt: {
                        $dateToString: {
                            date: '$updatedAt',
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        },
                    },
                },
            },
            { $sort: { updatedAt: -1, amount: -1 } },
        ]);
        return items.map((item) => ({
            ...item,
            availableActions: this.buildAvailableActions(item),
        }));
    }
    async getLoanQueueDetail(currentUser, loanId) {
        this.ensureStaffAccess(currentUser);
        const baseScope = { _id: new mongoose_2.Types.ObjectId(loanId) };
        if (currentUser.branchId && currentUser.role === enums_1.UserRole.BRANCH_MANAGER) {
            baseScope.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if (currentUser.districtId &&
            [enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role)) {
            baseScope.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const [item] = await this.loanModel.aggregate([
            { $match: baseScope },
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'member',
                },
            },
            { $unwind: '$member' },
            {
                $project: {
                    _id: 0,
                    loanId: { $toString: '$_id' },
                    memberId: { $toString: '$memberId' },
                    customerId: '$member.customerId',
                    memberName: '$member.fullName',
                    amount: 1,
                    level: '$currentLevel',
                    status: 1,
                    branchId: { $toString: '$branchId' },
                    districtId: { $toString: '$districtId' },
                    deficiencyReasons: { $ifNull: ['$deficiencyReasons', []] },
                    updatedAt: {
                        $dateToString: {
                            date: '$updatedAt',
                            format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        },
                    },
                },
            },
        ]);
        if (!item) {
            throw new common_1.NotFoundException('Loan queue item was not found.');
        }
        const history = await this.workflowHistoryModel
            .find({ loanId: new mongoose_2.Types.ObjectId(loanId) })
            .sort({ createdAt: 1 })
            .lean();
        return {
            ...item,
            nextAction: this.buildNextActionGuidance(item),
            availableActions: this.buildAvailableActions(item),
            history: history.map((entry) => ({
                action: entry.action,
                level: entry.level,
                fromStatus: entry.fromStatus,
                toStatus: entry.toStatus,
                actorRole: entry.actorRole,
                comment: entry.comment,
                createdAt: entry.createdAt?.toISOString(),
            })),
        };
    }
    async getLoanCustomerProfile(currentUser, loanId) {
        this.ensureStaffAccess(currentUser);
        const loan = await this.findAccessibleLoan(currentUser, loanId);
        const member = await this.memberModel.findById(loan.memberId).lean();
        if (!member) {
            throw new common_1.NotFoundException('Loan customer was not found.');
        }
        const memberId = loan.memberId;
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const [loans, repayments, autopaySettings, openLoanChats] = await Promise.all([
            this.loanModel
                .find({ memberId })
                .sort({ createdAt: -1 })
                .lean(),
            this.transactionModel
                .find({
                memberId,
                type: enums_1.PaymentType.LOAN_REPAYMENT,
                createdAt: { $gte: ninetyDaysAgo },
            })
                .sort({ createdAt: -1 })
                .lean(),
            this.autopaySettingModel
                .find({ memberId, enabled: true })
                .lean(),
            this.chatConversationModel
                .find({
                memberId,
                category: 'loan_issue',
                status: { $in: ['open', 'assigned', 'waiting_agent', 'waiting_customer'] },
            })
                .lean(),
        ]);
        const activeStatuses = [
            enums_1.LoanStatus.SUBMITTED,
            enums_1.LoanStatus.BRANCH_REVIEW,
            enums_1.LoanStatus.DISTRICT_REVIEW,
            enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
            enums_1.LoanStatus.APPROVED,
            enums_1.LoanStatus.DISBURSED,
            enums_1.LoanStatus.NEEDS_MORE_INFO,
        ];
        const activeLoans = loans.filter((item) => activeStatuses.includes(item.status));
        const closedLoans = loans.filter((item) => item.status === enums_1.LoanStatus.CLOSED);
        const rejectedLoans = loans.filter((item) => item.status === enums_1.LoanStatus.REJECTED);
        const totalBorrowedAmount = loans.reduce((sum, item) => sum + item.amount, 0);
        const totalClosedAmount = closedLoans.reduce((sum, item) => sum + item.amount, 0);
        const repaymentCount90d = repayments.length;
        const autopayServices = autopaySettings.map((item) => item.serviceType);
        const autopayEnabled = autopayServices.length > 0;
        const repaymentSignal = closedLoans.length > 0 && repaymentCount90d >= 2 && openLoanChats.length === 0
            ? 'strong'
            : repaymentCount90d > 0 || closedLoans.length > 0
                ? 'steady'
                : 'watch';
        const loyaltyTier = repaymentSignal === 'strong' && closedLoans.length > 0
            ? 'gold'
            : repaymentSignal !== 'watch'
                ? 'silver'
                : 'watch';
        const nextBestAction = loyaltyTier === 'gold'
            ? 'Offer loyalty review for top-up or pre-approved follow-up'
            : activeLoans.length > 0 && !autopayEnabled
                ? 'Offer loan repayment AutoPay or reminder support'
                : openLoanChats.length > 0
                    ? 'Resolve open support issues before sending a new offer'
                    : 'Keep customer on a repayment and reminder watchlist';
        const offerCue = loyaltyTier === 'gold'
            ? 'Strong repayment behavior can support a loyalty offer, renewal outreach, or top-up review.'
            : loyaltyTier === 'silver'
                ? 'Customer is showing usable repayment discipline. Offer reminders or AutoPay to improve stickiness.'
                : 'Do not send a credit offer yet. Focus on support, reminders, or documentation completion first.';
        return {
            memberId: member._id.toString(),
            customerId: member.customerId,
            memberName: member.fullName,
            branchId: member.branchId?.toString(),
            districtId: member.districtId?.toString(),
            activeLoans: activeLoans.length,
            closedLoans: closedLoans.length,
            rejectedLoans: rejectedLoans.length,
            totalLoanCount: loans.length,
            totalBorrowedAmount,
            totalClosedAmount,
            repaymentCount90d,
            lastRepaymentAt: repayments[0]?.createdAt?.toISOString(),
            autopayEnabled,
            autopayServices,
            repaymentSignal,
            loyaltyTier,
            nextBestAction,
            offerCue,
            openSupportCases: openLoanChats.length,
            activeLoanStatuses: activeLoans.map((item) => item.status),
        };
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
        loan.deficiencyReasons = this.resolveDeficiencyReasons(loan, dto);
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
        const notification = (0, banking_notification_builders_1.buildLoanWorkflowNotification)({
            action: dto.action,
            status: transition.status,
            level: transition.level,
            deficiencyReasons: loan.deficiencyReasons ?? [],
        });
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: loan.memberId.toString(),
            type: notification.type,
            status: notification.status,
            title: notification.title,
            message: notification.message,
            entityType: 'loan',
            entityId: loan._id.toString(),
            actionLabel: 'Open loan',
            priority: dto.action === enums_1.LoanAction.RETURN_FOR_CORRECTION ||
                dto.action === enums_1.LoanAction.REJECT
                ? 'high'
                : 'normal',
            deepLink: `/loans/${loan._id.toString()}`,
        });
        await this.auditService.logActorAction({
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
    async findAccessibleLoan(currentUser, loanId) {
        const scope = { _id: new mongoose_2.Types.ObjectId(loanId) };
        if (currentUser.branchId && currentUser.role === enums_1.UserRole.BRANCH_MANAGER) {
            scope.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if (currentUser.districtId &&
            [enums_1.UserRole.DISTRICT_OFFICER, enums_1.UserRole.DISTRICT_MANAGER].includes(currentUser.role)) {
            scope.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const loan = await this.loanModel.findOne(scope);
        if (!loan) {
            throw new common_1.NotFoundException('Loan queue item was not found.');
        }
        return loan;
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
    resolveDeficiencyReasons(loan, dto) {
        if (dto.action === enums_1.LoanAction.RETURN_FOR_CORRECTION) {
            const reasons = dto.deficiencyReasons
                ?.map((item) => item.trim())
                .filter((item) => item.length > 0) ?? [];
            if (reasons.length === 0) {
                throw new common_1.BadRequestException('Deficiency reasons are required when returning a loan for correction.');
            }
            return reasons;
        }
        if (dto.action === enums_1.LoanAction.APPROVE ||
            dto.action === enums_1.LoanAction.DISBURSE ||
            dto.action === enums_1.LoanAction.CLOSE) {
            return [];
        }
        return loan.deficiencyReasons ?? [];
    }
    buildNextActionGuidance(item) {
        if (item.deficiencyReasons.length > 0) {
            return `Customer correction is required before approval: ${item.deficiencyReasons.join(', ')}.`;
        }
        if (item.level === enums_1.LoanWorkflowLevel.BRANCH) {
            return 'Continue branch review or forward the case if it exceeds branch approval limits.';
        }
        if (item.level === enums_1.LoanWorkflowLevel.DISTRICT) {
            return 'District team should complete review or escalate higher-value cases to head office.';
        }
        if (item.level === enums_1.LoanWorkflowLevel.HEAD_OFFICE) {
            return 'Head office should complete final controls, approve, or return for correction.';
        }
        return 'Review the latest workflow history and decide the next operational step.';
    }
    buildAvailableActions(item) {
        const actions = [];
        if ([
            enums_1.LoanStatus.SUBMITTED,
            enums_1.LoanStatus.BRANCH_REVIEW,
            enums_1.LoanStatus.DISTRICT_REVIEW,
            enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
        ].includes(item.status)) {
            actions.push(enums_1.LoanAction.REVIEW, enums_1.LoanAction.RETURN_FOR_CORRECTION);
        }
        if ([enums_1.LoanWorkflowLevel.BRANCH, enums_1.LoanWorkflowLevel.DISTRICT].includes(item.level) &&
            [enums_1.LoanStatus.SUBMITTED, enums_1.LoanStatus.BRANCH_REVIEW, enums_1.LoanStatus.DISTRICT_REVIEW].includes(item.status)) {
            actions.push(enums_1.LoanAction.FORWARD);
        }
        if (this.canApproveAtCurrentLevel(item)) {
            actions.push(enums_1.LoanAction.APPROVE);
        }
        return actions;
    }
    canApproveAtCurrentLevel(item) {
        if (![
            enums_1.LoanStatus.SUBMITTED,
            enums_1.LoanStatus.BRANCH_REVIEW,
            enums_1.LoanStatus.DISTRICT_REVIEW,
            enums_1.LoanStatus.HEAD_OFFICE_REVIEW,
        ].includes(item.status)) {
            return false;
        }
        if (item.level === enums_1.LoanWorkflowLevel.HEAD_OFFICE) {
            return true;
        }
        return item.amount <= constants_1.BRANCH_MAX_APPROVAL_AMOUNT;
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
};
exports.LoanWorkflowService = LoanWorkflowService;
exports.LoanWorkflowService = LoanWorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(loan_schema_1.Loan.name)),
    __param(1, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(3, (0, mongoose_1.InjectModel)(autopay_setting_schema_1.AutopaySetting.name)),
    __param(4, (0, mongoose_1.InjectModel)(chat_conversation_schema_1.ChatConversation.name)),
    __param(5, (0, mongoose_1.InjectModel)(loan_workflow_history_schema_1.LoanWorkflowHistory.name)),
    __param(6, (0, mongoose_1.InjectModel)(staff_activity_log_schema_1.StaffActivityLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], LoanWorkflowService);
//# sourceMappingURL=loan-workflow.service.js.map