import { AuthenticatedUser } from '../auth/interfaces';
import { CreateSchoolPaymentDto, SchoolPaymentSummaryQueryDto } from './dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createSchoolPayment(currentUser: AuthenticatedUser, dto: CreateSchoolPaymentDto): Promise<import("./interfaces").SchoolPaymentResult>;
    getMySchoolPayments(currentUser: AuthenticatedUser): Promise<(import("mongoose").FlattenMaps<import("mongoose").Document<unknown, {}, import("./schemas/school-payment.schema").SchoolPayment, {}, {}> & import("./schemas/school-payment.schema").SchoolPayment & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }>)[]>;
    getSchoolPaymentSummary(currentUser: AuthenticatedUser, query: SchoolPaymentSummaryQueryDto): Promise<import("./interfaces").SchoolPaymentSummary>;
}
