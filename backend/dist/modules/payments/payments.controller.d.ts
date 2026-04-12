import { AuthenticatedUser } from '../auth/interfaces';
import { CreateQrPaymentDto, CreateSchoolPaymentDto, SchoolPaymentSummaryQueryDto } from './dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createSchoolPayment(currentUser: AuthenticatedUser, dto: CreateSchoolPaymentDto): Promise<import("./interfaces").SchoolPaymentResult>;
    createQrPayment(currentUser: AuthenticatedUser, dto: CreateQrPaymentDto): Promise<import("./interfaces").QrPaymentResult>;
    getMySchoolPayments(currentUser: AuthenticatedUser): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/school-payment.schema").SchoolPayment, {}, {}> & import("./schemas/school-payment.schema").SchoolPayment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    getMyPaymentReceipts(currentUser: AuthenticatedUser): Promise<import("./interfaces").PaymentReceiptItem[]>;
    getMyPaymentActivity(currentUser: AuthenticatedUser): Promise<import("./interfaces").PaymentActivityItem | null>;
    getManagerPaymentReceipts(currentUser: AuthenticatedUser, memberId: string): Promise<import("./interfaces").PaymentReceiptItem[]>;
    getManagerPaymentActivity(currentUser: AuthenticatedUser): Promise<import("./interfaces").PaymentActivityItem[]>;
    getSchoolPaymentSummary(currentUser: AuthenticatedUser, query: SchoolPaymentSummaryQueryDto): Promise<import("./interfaces").SchoolPaymentSummary>;
}
