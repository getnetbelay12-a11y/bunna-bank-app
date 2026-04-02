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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
const audit_service_1 = require("../audit/audit.service");
const notification_schema_1 = require("../notifications/schemas/notification.schema");
const savings_account_schema_1 = require("../savings/schemas/savings-account.schema");
const payment_notification_port_1 = require("./payment-notification.port");
const school_payment_schema_1 = require("./schemas/school-payment.schema");
const transaction_schema_1 = require("./schemas/transaction.schema");
let PaymentsService = class PaymentsService {
    constructor(transactionModel, schoolPaymentModel, notificationModel, savingsAccountModel, paymentNotificationPort, auditService) {
        this.transactionModel = transactionModel;
        this.schoolPaymentModel = schoolPaymentModel;
        this.notificationModel = notificationModel;
        this.savingsAccountModel = savingsAccountModel;
        this.paymentNotificationPort = paymentNotificationPort;
        this.auditService = auditService;
    }
    async createSchoolPayment(currentUser, dto) {
        this.ensureMemberAccess(currentUser);
        const account = await this.savingsAccountModel
            .findById(dto.accountId)
            .lean();
        if (!account || account.memberId.toString() !== currentUser.sub) {
            throw new common_1.NotFoundException('Savings account not found for this member.');
        }
        const transactionId = new mongoose_2.Types.ObjectId();
        const transactionReference = this.buildTransactionReference();
        const now = new Date();
        await this.transactionModel.create({
            _id: transactionId,
            transactionReference,
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            accountId: new mongoose_2.Types.ObjectId(dto.accountId),
            branchId: account.branchId,
            type: enums_1.PaymentType.SCHOOL_PAYMENT,
            channel: dto.channel,
            amount: dto.amount,
            currency: account.currency,
            narration: dto.narration ?? `School payment for ${dto.schoolName}`,
        });
        const schoolPayment = await this.schoolPaymentModel.create({
            transactionId,
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            accountId: new mongoose_2.Types.ObjectId(dto.accountId),
            branchId: account.branchId,
            studentId: dto.studentId,
            schoolName: dto.schoolName,
            amount: dto.amount,
            channel: dto.channel,
            status: 'successful',
        });
        const notificationStatus = await this.paymentNotificationPort.dispatch({
            userId: currentUser.sub,
            title: 'School Payment Successful',
            message: `Your payment to ${dto.schoolName} has been recorded successfully.`,
        });
        await this.notificationModel.create({
            userType: 'member',
            userId: new mongoose_2.Types.ObjectId(currentUser.sub),
            userRole: currentUser.role,
            type: enums_1.NotificationType.PAYMENT,
            status: notificationStatus,
            title: 'School Payment Successful',
            message: `Your payment to ${dto.schoolName} has been recorded successfully.`,
            entityType: 'school_payment',
            entityId: schoolPayment._id,
            readAt: undefined,
            createdAt: now,
            updatedAt: now,
        });
        await this.auditService.log({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: 'school_payment_created',
            entityType: 'school_payment',
            entityId: schoolPayment._id.toString(),
            before: null,
            after: {
                transactionId: transactionId.toString(),
                amount: dto.amount,
                channel: dto.channel,
                status: 'successful',
            },
        });
        return {
            schoolPaymentId: schoolPayment._id.toString(),
            transactionId: transactionId.toString(),
            transactionReference,
            notificationStatus,
        };
    }
    async getMySchoolPayments(currentUser) {
        this.ensureMemberAccess(currentUser);
        return this.schoolPaymentModel
            .find({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) })
            .sort({ createdAt: -1 })
            .lean();
    }
    async getSchoolPaymentSummary(currentUser, query) {
        this.ensureStaffAccess(currentUser);
        const match = {};
        if (query.branchId) {
            match.branchId = new mongoose_2.Types.ObjectId(query.branchId);
        }
        else if (currentUser.branchId && currentUser.role === enums_1.UserRole.BRANCH_MANAGER) {
            match.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
        }
        if (query.dateFrom || query.dateTo) {
            match.createdAt = {};
            if (query.dateFrom) {
                match.createdAt.$gte = new Date(query.dateFrom);
            }
            if (query.dateTo) {
                match.createdAt.$lte = new Date(query.dateTo);
            }
        }
        const [summary] = await this.schoolPaymentModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    mobilePayments: {
                        $sum: { $cond: [{ $eq: ['$channel', 'mobile'] }, 1, 0] },
                    },
                    branchPayments: {
                        $sum: { $cond: [{ $eq: ['$channel', 'branch'] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalPayments: 1,
                    totalAmount: 1,
                    mobilePayments: 1,
                    branchPayments: 1,
                },
            },
        ]);
        return (summary ?? {
            totalPayments: 0,
            totalAmount: 0,
            mobilePayments: 0,
            branchPayments: 0,
        });
    }
    ensureMemberAccess(currentUser) {
        if (currentUser.role !== enums_1.UserRole.MEMBER &&
            currentUser.role !== enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only members can create school payments.');
        }
    }
    ensureStaffAccess(currentUser) {
        if (currentUser.role === enums_1.UserRole.MEMBER ||
            currentUser.role === enums_1.UserRole.SHAREHOLDER_MEMBER) {
            throw new common_1.ForbiddenException('Only staff users can view payment summaries.');
        }
    }
    buildTransactionReference() {
        return `TXN-${Date.now()}`;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(school_payment_schema_1.SchoolPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(3, (0, mongoose_1.InjectModel)(savings_account_schema_1.SavingsAccount.name)),
    __param(4, (0, common_1.Inject)(payment_notification_port_1.PAYMENT_NOTIFICATION_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model, Object, audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map