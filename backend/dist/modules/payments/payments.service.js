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
const member_schema_1 = require("../members/schemas/member.schema");
const banking_notification_builders_1 = require("../notifications/banking-notification-builders");
const notifications_service_1 = require("../notifications/notifications.service");
const school_reports_service_1 = require("../school-reports/school-reports.service");
const school_payments_service_1 = require("../school-payments/school-payments.service");
const service_request_schema_1 = require("../service-requests/schemas/service-request.schema");
const member_security_setting_schema_1 = require("../service-placeholders/schemas/member-security-setting.schema");
const savings_account_schema_1 = require("../savings/schemas/savings-account.schema");
const payment_notification_port_1 = require("./payment-notification.port");
const school_payment_schema_1 = require("./schemas/school-payment.schema");
const transaction_schema_1 = require("./schemas/transaction.schema");
const students_service_1 = require("../students/students.service");
let PaymentsService = class PaymentsService {
    constructor(transactionModel, schoolPaymentModel, savingsAccountModel, memberModel, serviceRequestModel, securityModel, paymentNotificationPort, auditService, notificationsService, schoolPaymentsService, studentsService, schoolReportsService) {
        this.transactionModel = transactionModel;
        this.schoolPaymentModel = schoolPaymentModel;
        this.savingsAccountModel = savingsAccountModel;
        this.memberModel = memberModel;
        this.serviceRequestModel = serviceRequestModel;
        this.securityModel = securityModel;
        this.paymentNotificationPort = paymentNotificationPort;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.schoolPaymentsService = schoolPaymentsService;
        this.studentsService = studentsService;
        this.schoolReportsService = schoolReportsService;
    }
    async createSchoolPayment(currentUser, dto) {
        this.ensureMemberAccess(currentUser);
        const member = await this.loadEligibleMember(currentUser);
        const existingAccount = await this.savingsAccountModel
            .findById(dto.accountId)
            .lean();
        if (!existingAccount ||
            existingAccount.memberId.toString() !== currentUser.sub ||
            !existingAccount.isActive) {
            throw new common_1.NotFoundException('Savings account not found for this member.');
        }
        const account = await this.savingsAccountModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(dto.accountId),
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            isActive: true,
            balance: { $gte: dto.amount },
        }, { $inc: { balance: -dto.amount } }, { new: true });
        if (!account) {
            throw new common_1.BadRequestException('Insufficient available balance for this school payment.');
        }
        const transactionId = new mongoose_2.Types.ObjectId();
        const transactionReference = this.buildTransactionReference();
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
        const schoolCollection = this.schoolPaymentsService.recordMemberPayment({
            studentId: dto.studentId,
            schoolName: dto.schoolName,
            amount: dto.amount,
            channel: dto.channel,
        });
        const student = this.studentsService
            .list()
            .find((item) => item.studentId === dto.studentId);
        const performance = this.schoolReportsService.getStudentPerformance({
            studentId: dto.studentId,
            fullName: student?.fullName,
            grade: student?.grade,
        });
        const paymentNotificationPreview = (0, banking_notification_builders_1.buildSchoolPaymentNotification)(dto.schoolName, enums_1.NotificationStatus.PENDING, {
            studentName: student?.fullName,
            grade: student?.grade,
            latestAverage: performance.latestAverage,
            attendanceRate: performance.attendanceRate,
            remainingBalance: schoolCollection?.remainingBalance,
        });
        const notificationStatus = await this.paymentNotificationPort.dispatch({
            userId: currentUser.sub,
            title: paymentNotificationPreview.title,
            message: paymentNotificationPreview.message,
        });
        const paymentNotification = (0, banking_notification_builders_1.buildSchoolPaymentNotification)(dto.schoolName, notificationStatus === 'sent'
            ? enums_1.NotificationStatus.SENT
            : enums_1.NotificationStatus.FAILED, {
            studentName: student?.fullName,
            grade: student?.grade,
            latestAverage: performance.latestAverage,
            attendanceRate: performance.attendanceRate,
            remainingBalance: schoolCollection?.remainingBalance,
        });
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: currentUser.sub,
            userRole: currentUser.role,
            type: enums_1.NotificationType.PAYMENT_SUCCESS,
            status: paymentNotification.status,
            title: paymentNotification.title,
            message: paymentNotification.message,
            entityType: 'school_payment',
            entityId: schoolPayment._id.toString(),
            actionLabel: 'Open payment details',
            priority: 'normal',
            deepLink: `/payments/receipts?receiptId=school_payment_${schoolPayment._id.toString()}` +
                `&studentId=${encodeURIComponent(dto.studentId)}`,
            dataPayload: {
                profileId: dto.studentId,
                route: `/payments/receipts?receiptId=school_payment_${schoolPayment._id.toString()}` +
                    `&studentId=${encodeURIComponent(dto.studentId)}`,
                receiptId: `school_payment_${schoolPayment._id.toString()}`,
                studentId: dto.studentId,
                studentName: student?.fullName,
                schoolName: dto.schoolName,
                amount: dto.amount,
            },
        });
        await this.auditService.logActorAction({
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
                accountBalanceAfter: account.balance,
                memberKycStatus: member.kycStatus,
                schoolCollectionReceiptNo: schoolCollection?.receiptNo,
                schoolCollectionInvoiceNo: schoolCollection?.invoiceNo,
                remainingBalance: schoolCollection?.remainingBalance,
            },
        });
        return {
            schoolPaymentId: schoolPayment._id.toString(),
            transactionId: transactionId.toString(),
            transactionReference,
            notificationStatus,
        };
    }
    async createQrPayment(currentUser, dto) {
        this.ensureMemberAccess(currentUser);
        const member = await this.loadEligibleMember(currentUser);
        const existingAccount = await this.savingsAccountModel
            .findById(dto.accountId)
            .lean();
        if (!existingAccount ||
            existingAccount.memberId.toString() !== currentUser.sub ||
            !existingAccount.isActive) {
            throw new common_1.NotFoundException('Savings account not found for this member.');
        }
        const account = await this.savingsAccountModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(dto.accountId),
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            isActive: true,
            balance: { $gte: dto.amount },
        }, { $inc: { balance: -dto.amount } }, { new: true });
        if (!account) {
            throw new common_1.BadRequestException('Insufficient available balance for this QR payment.');
        }
        const transactionId = new mongoose_2.Types.ObjectId();
        const transactionReference = this.buildTransactionReference('QRP');
        await this.transactionModel.create({
            _id: transactionId,
            transactionReference,
            memberId: new mongoose_2.Types.ObjectId(currentUser.sub),
            accountId: new mongoose_2.Types.ObjectId(dto.accountId),
            branchId: account.branchId,
            type: enums_1.PaymentType.QR_PAYMENT,
            channel: 'mobile',
            amount: dto.amount,
            currency: account.currency,
            externalReference: dto.qrPayload,
            narration: dto.narration ?? `QR payment to ${dto.merchantName}`,
        });
        const notificationStatus = await this.paymentNotificationPort.dispatch({
            userId: currentUser.sub,
            title: 'QR Payment Successful',
            message: `Your QR payment to ${dto.merchantName} was recorded successfully.`,
        });
        await this.notificationsService.createNotification({
            userType: 'member',
            userId: currentUser.sub,
            userRole: currentUser.role,
            type: enums_1.NotificationType.PAYMENT_SUCCESS,
            status: notificationStatus === 'sent'
                ? enums_1.NotificationStatus.SENT
                : enums_1.NotificationStatus.FAILED,
            title: 'QR Payment Successful',
            message: `Your QR payment to ${dto.merchantName} was recorded successfully.`,
            entityType: 'transaction',
            entityId: transactionId.toString(),
            actionLabel: 'Open receipts',
            priority: 'normal',
            deepLink: '/payments/receipts?filter=qr',
        });
        await this.auditService.logActorAction({
            actorId: currentUser.sub,
            actorRole: currentUser.role,
            actionType: 'qr_payment_created',
            entityType: 'transaction',
            entityId: transactionId.toString(),
            before: null,
            after: {
                amount: dto.amount,
                merchantName: dto.merchantName,
                accountBalanceAfter: account.balance,
                memberKycStatus: member.kycStatus,
            },
        });
        return {
            transactionId: transactionId.toString(),
            transactionReference,
            notificationStatus,
            merchantName: dto.merchantName,
            amount: dto.amount,
        };
    }
    async getMySchoolPayments(currentUser) {
        this.ensureMemberAccess(currentUser);
        return this.schoolPaymentModel
            .find({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) })
            .sort({ createdAt: -1 })
            .lean();
    }
    async getMyPaymentReceipts(currentUser) {
        this.ensureMemberAccess(currentUser);
        return this.buildPaymentReceiptsForMember(new mongoose_2.Types.ObjectId(currentUser.sub));
    }
    async getMyPaymentActivity(currentUser) {
        this.ensureMemberAccess(currentUser);
        const member = await this.memberModel
            .findById(currentUser.sub)
            .lean();
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        const receipts = await this.buildPaymentReceiptsForMember(new mongoose_2.Types.ObjectId(currentUser.sub));
        return {
            memberId: member._id.toString(),
            customerId: member.customerId,
            memberName: member.fullName,
            phone: member.phone,
            branchName: member.preferredBranchName,
            openCases: receipts.filter((item) => (item.receiptType === 'payment_dispute' ||
                item.receiptType === 'failed_transfer') &&
                item.status !== 'completed' &&
                item.status !== 'rejected').length,
            totalReceipts: receipts.length,
            qrPayments: receipts.filter((item) => item.receiptType === 'qr_payment').length,
            schoolPayments: receipts.filter((item) => item.receiptType === 'school_payment').length,
            disputeReceipts: receipts.filter((item) => item.receiptType === 'payment_dispute' ||
                item.receiptType === 'failed_transfer').length,
            latestActivityAt: receipts.length > 0 ? receipts[0]?.recordedAt : undefined,
        };
    }
    async getManagerPaymentReceipts(currentUser, memberId) {
        this.ensureStaffAccess(currentUser);
        const member = await this.memberModel.findById(memberId).lean();
        if (!member) {
            throw new common_1.NotFoundException('Member not found.');
        }
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER &&
            currentUser.branchName &&
            member.preferredBranchName !== currentUser.branchName) {
            throw new common_1.ForbiddenException('This member is outside your branch scope.');
        }
        return this.buildPaymentReceiptsForMember(new mongoose_2.Types.ObjectId(memberId));
    }
    async getManagerPaymentActivity(currentUser) {
        this.ensureStaffAccess(currentUser);
        const [schoolPayments, qrPayments, paymentRequests] = await Promise.all([
            this.schoolPaymentModel.find({}).sort({ createdAt: -1 }).lean(),
            this.transactionModel
                .find({ type: enums_1.PaymentType.QR_PAYMENT })
                .sort({ createdAt: -1 })
                .lean(),
            this.serviceRequestModel
                .find({
                type: { $in: ['payment_dispute', 'failed_transfer'] },
            })
                .sort({ updatedAt: -1 })
                .lean(),
        ]);
        const memberIds = new Set();
        for (const item of schoolPayments) {
            memberIds.add(item.memberId.toString());
        }
        for (const item of qrPayments) {
            memberIds.add(item.memberId.toString());
        }
        for (const item of paymentRequests) {
            memberIds.add(item.memberId.toString());
        }
        if (memberIds.size === 0) {
            return [];
        }
        const memberScopeFilter = {
            _id: { $in: [...memberIds].map((item) => new mongoose_2.Types.ObjectId(item)) },
        };
        if (currentUser.role === enums_1.UserRole.BRANCH_MANAGER ||
            currentUser.role === enums_1.UserRole.LOAN_OFFICER) {
            if (currentUser.branchId) {
                memberScopeFilter.branchId = new mongoose_2.Types.ObjectId(currentUser.branchId);
            }
            else if (currentUser.branchName) {
                memberScopeFilter.preferredBranchName = currentUser.branchName;
            }
        }
        else if ((currentUser.role === enums_1.UserRole.DISTRICT_MANAGER ||
            currentUser.role === enums_1.UserRole.DISTRICT_OFFICER) &&
            currentUser.districtId) {
            memberScopeFilter.districtId = new mongoose_2.Types.ObjectId(currentUser.districtId);
        }
        const members = await this.memberModel.find(memberScopeFilter).lean();
        const membersById = new Map(members.map((item) => [item._id.toString(), item]));
        const activityByMember = new Map();
        const ensureActivity = (memberId) => {
            const existing = activityByMember.get(memberId);
            if (existing) {
                return existing;
            }
            const member = membersById.get(memberId);
            if (!member) {
                return null;
            }
            const created = {
                memberId,
                customerId: member.customerId,
                memberName: member.fullName,
                phone: member.phone,
                branchName: member.preferredBranchName,
                openCases: 0,
                totalReceipts: 0,
                qrPayments: 0,
                schoolPayments: 0,
                disputeReceipts: 0,
            };
            activityByMember.set(memberId, created);
            return created;
        };
        const bumpLatest = (current, nextDate) => {
            if (!nextDate) {
                return;
            }
            if (!current.latestActivityAt || nextDate.getTime() > current.latestActivityAt.getTime()) {
                current.latestActivityAt = nextDate;
            }
        };
        for (const item of schoolPayments) {
            const current = ensureActivity(item.memberId.toString());
            if (!current) {
                continue;
            }
            current.totalReceipts += 1;
            current.schoolPayments += 1;
            bumpLatest(current, item.createdAt);
        }
        for (const item of qrPayments) {
            const current = ensureActivity(item.memberId.toString());
            if (!current) {
                continue;
            }
            current.totalReceipts += 1;
            current.qrPayments += 1;
            bumpLatest(current, item.createdAt);
        }
        for (const item of paymentRequests) {
            const current = ensureActivity(item.memberId.toString());
            if (!current) {
                continue;
            }
            current.totalReceipts += 1;
            current.disputeReceipts += 1;
            if (item.status !== 'completed' && item.status !== 'rejected') {
                current.openCases += 1;
            }
            bumpLatest(current, item.updatedAt ?? item.createdAt);
        }
        return [...activityByMember.values()].sort((left, right) => {
            const leftTime = left.latestActivityAt?.getTime() ?? 0;
            const rightTime = right.latestActivityAt?.getTime() ?? 0;
            return rightTime - leftTime;
        });
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
    async loadEligibleMember(currentUser) {
        const [member, security] = await Promise.all([
            this.memberModel.findById(currentUser.sub).lean(),
            this.securityModel
                .findOne({ memberId: new mongoose_2.Types.ObjectId(currentUser.sub) })
                .lean(),
        ]);
        if (!member || !member.isActive) {
            throw new common_1.ForbiddenException('Member account is inactive.');
        }
        if (!this.hasVerifiedKyc(member.kycStatus)) {
            throw new common_1.ForbiddenException('Complete Fayda verification before using school payment services.');
        }
        if (security?.accountLockEnabled) {
            throw new common_1.ForbiddenException('Account lock is enabled. Unlock the account before making payments.');
        }
        return member;
    }
    hasVerifiedKyc(status) {
        return ['verified', 'demo_approved', 'active_demo'].includes(status?.toLowerCase() ?? '');
    }
    buildTransactionReference(prefix = 'TXN') {
        return `${prefix}-${Date.now()}`;
    }
    async buildPaymentReceiptsForMember(memberId) {
        const [schoolPayments, qrPayments, paymentRequests] = await Promise.all([
            this.schoolPaymentModel.find({ memberId }).sort({ createdAt: -1 }).lean(),
            this.transactionModel
                .find({ memberId, type: enums_1.PaymentType.QR_PAYMENT })
                .sort({ createdAt: -1 })
                .lean(),
            this.serviceRequestModel
                .find({
                memberId,
                type: { $in: ['payment_dispute', 'failed_transfer'] },
            })
                .sort({ updatedAt: -1 })
                .lean(),
        ]);
        const schoolPaymentReceipts = schoolPayments.map((item) => ({
            receiptId: `school_payment_${item._id.toString()}`,
            receiptType: 'school_payment',
            sourceId: item._id.toString(),
            title: item.schoolName,
            description: `School payment for ${item.schoolName}.`,
            status: item.status,
            amount: item.amount,
            currency: 'ETB',
            channel: item.channel,
            attachments: [],
            recordedAt: item.createdAt,
            metadata: {
                studentId: item.studentId,
                accountId: item.accountId.toString(),
                branchId: item.branchId.toString(),
                transactionId: item.transactionId.toString(),
            },
        }));
        const qrPaymentReceipts = qrPayments.map((item) => {
            const merchantName = this.extractQrMerchantName(item.narration);
            return {
                receiptId: `qr_payment_${item._id.toString()}`,
                receiptType: 'qr_payment',
                sourceId: item._id.toString(),
                title: merchantName ?? 'QR Merchant Payment',
                description: item.narration ?? 'QR merchant payment.',
                status: 'successful',
                amount: item.amount,
                currency: item.currency,
                transactionReference: item.transactionReference,
                counterparty: merchantName,
                channel: item.channel,
                attachments: [],
                recordedAt: item.createdAt,
                metadata: {
                    accountId: item.accountId.toString(),
                    branchId: item.branchId.toString(),
                    qrPayload: item.externalReference,
                },
            };
        });
        const serviceRequestReceipts = paymentRequests.map((item) => ({
            receiptId: `service_request_${item._id.toString()}`,
            receiptType: item.type === 'failed_transfer' ? 'failed_transfer' : 'payment_dispute',
            sourceId: item._id.toString(),
            title: item.title,
            description: item.latestNote ?? item.description,
            status: item.status,
            amount: typeof item.payload?.amount === 'number'
                ? item.payload.amount
                : undefined,
            currency: 'ETB',
            transactionReference: typeof item.payload?.transactionReference === 'string'
                ? item.payload.transactionReference
                : undefined,
            counterparty: typeof item.payload?.counterparty === 'string'
                ? item.payload.counterparty
                : undefined,
            attachments: item.attachments ?? [],
            recordedAt: item.updatedAt ?? item.createdAt,
            metadata: {
                occurredAt: typeof item.payload?.occurredAt === 'string'
                    ? item.payload.occurredAt
                    : undefined,
            },
        }));
        return [
            ...schoolPaymentReceipts,
            ...qrPaymentReceipts,
            ...serviceRequestReceipts,
        ].sort((left, right) => {
            const leftTime = left.recordedAt?.getTime() ?? 0;
            const rightTime = right.recordedAt?.getTime() ?? 0;
            return rightTime - leftTime;
        });
    }
    extractQrMerchantName(narration) {
        if (!narration) {
            return undefined;
        }
        const prefix = 'QR payment to ';
        if (narration.startsWith(prefix)) {
            return narration.slice(prefix.length).trim() || undefined;
        }
        return undefined;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(school_payment_schema_1.SchoolPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(savings_account_schema_1.SavingsAccount.name)),
    __param(3, (0, mongoose_1.InjectModel)(member_schema_1.Member.name)),
    __param(4, (0, mongoose_1.InjectModel)(service_request_schema_1.ServiceRequest.name)),
    __param(5, (0, mongoose_1.InjectModel)(member_security_setting_schema_1.MemberSecuritySetting.name)),
    __param(6, (0, common_1.Inject)(payment_notification_port_1.PAYMENT_NOTIFICATION_PORT)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model, Object, audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        school_payments_service_1.SchoolPaymentsService,
        students_service_1.StudentsService,
        school_reports_service_1.SchoolReportsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map