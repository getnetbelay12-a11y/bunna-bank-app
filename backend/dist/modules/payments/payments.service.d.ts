import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { NotificationDocument } from '../notifications/schemas/notification.schema';
import { SavingsAccountDocument } from '../savings/schemas/savings-account.schema';
import { CreateSchoolPaymentDto, SchoolPaymentSummaryQueryDto } from './dto';
import { SchoolPaymentResult, SchoolPaymentSummary } from './interfaces';
import { PaymentNotificationPort } from './payment-notification.port';
import { SchoolPayment, SchoolPaymentDocument } from './schemas/school-payment.schema';
import { TransactionDocument } from './schemas/transaction.schema';
export declare class PaymentsService {
    private readonly transactionModel;
    private readonly schoolPaymentModel;
    private readonly notificationModel;
    private readonly savingsAccountModel;
    private readonly paymentNotificationPort;
    private readonly auditService;
    constructor(transactionModel: Model<TransactionDocument>, schoolPaymentModel: Model<SchoolPaymentDocument>, notificationModel: Model<NotificationDocument>, savingsAccountModel: Model<SavingsAccountDocument>, paymentNotificationPort: PaymentNotificationPort, auditService: AuditService);
    createSchoolPayment(currentUser: AuthenticatedUser, dto: CreateSchoolPaymentDto): Promise<SchoolPaymentResult>;
    getMySchoolPayments(currentUser: AuthenticatedUser): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, SchoolPayment, {}, {}> & SchoolPayment & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: Types.ObjectId;
    }>)[]>;
    getSchoolPaymentSummary(currentUser: AuthenticatedUser, query: SchoolPaymentSummaryQueryDto): Promise<SchoolPaymentSummary>;
    private ensureMemberAccess;
    private ensureStaffAccess;
    private buildTransactionReference;
}
