import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { MemberDocument } from '../members/schemas/member.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { SchoolReportsService } from '../school-reports/school-reports.service';
import { SchoolPaymentsService } from '../school-payments/school-payments.service';
import { ServiceRequestDocument } from '../service-requests/schemas/service-request.schema';
import { MemberSecuritySettingDocument } from '../service-placeholders/schemas/member-security-setting.schema';
import { SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { CreateQrPaymentDto, CreateSchoolPaymentDto, SchoolPaymentSummaryQueryDto } from './dto';
import { PaymentActivityItem, PaymentReceiptItem, QrPaymentResult, SchoolPaymentResult, SchoolPaymentSummary } from './interfaces';
import { PaymentNotificationPort } from './payment-notification.port';
import { SchoolPayment, SchoolPaymentDocument } from './schemas/school-payment.schema';
import { TransactionDocument } from './schemas/transaction.schema';
import { StudentsService } from '../students/students.service';
export declare class PaymentsService {
    private readonly transactionModel;
    private readonly schoolPaymentModel;
    private readonly savingsAccountModel;
    private readonly memberModel;
    private readonly serviceRequestModel;
    private readonly securityModel;
    private readonly paymentNotificationPort;
    private readonly auditService;
    private readonly notificationsService;
    private readonly schoolPaymentsService;
    private readonly studentsService;
    private readonly schoolReportsService;
    constructor(transactionModel: Model<TransactionDocument>, schoolPaymentModel: Model<SchoolPaymentDocument>, savingsAccountModel: Model<SavingsAccountDocument>, memberModel: Model<MemberDocument>, serviceRequestModel: Model<ServiceRequestDocument>, securityModel: Model<MemberSecuritySettingDocument>, paymentNotificationPort: PaymentNotificationPort, auditService: AuditService, notificationsService: NotificationsService, schoolPaymentsService: SchoolPaymentsService, studentsService: StudentsService, schoolReportsService: SchoolReportsService);
    createSchoolPayment(currentUser: AuthenticatedUser, dto: CreateSchoolPaymentDto): Promise<SchoolPaymentResult>;
    createQrPayment(currentUser: AuthenticatedUser, dto: CreateQrPaymentDto): Promise<QrPaymentResult>;
    getMySchoolPayments(currentUser: AuthenticatedUser): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, SchoolPayment, {}, {}> & SchoolPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    getMyPaymentReceipts(currentUser: AuthenticatedUser): Promise<PaymentReceiptItem[]>;
    getMyPaymentActivity(currentUser: AuthenticatedUser): Promise<PaymentActivityItem | null>;
    getManagerPaymentReceipts(currentUser: AuthenticatedUser, memberId: string): Promise<PaymentReceiptItem[]>;
    getManagerPaymentActivity(currentUser: AuthenticatedUser): Promise<PaymentActivityItem[]>;
    getSchoolPaymentSummary(currentUser: AuthenticatedUser, query: SchoolPaymentSummaryQueryDto): Promise<SchoolPaymentSummary>;
    private ensureMemberAccess;
    private ensureStaffAccess;
    private loadEligibleMember;
    private hasVerifiedKyc;
    private buildTransactionReference;
    private buildPaymentReceiptsForMember;
    private extractQrMerchantName;
}
