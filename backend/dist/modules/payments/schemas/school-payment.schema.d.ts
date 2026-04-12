import { HydratedDocument, Types } from 'mongoose';
export type SchoolPaymentDocument = HydratedDocument<SchoolPayment>;
export declare class SchoolPayment {
    transactionId: Types.ObjectId;
    memberId: Types.ObjectId;
    staffId?: Types.ObjectId;
    accountId: Types.ObjectId;
    branchId: Types.ObjectId;
    studentId: string;
    schoolName: string;
    amount: number;
    channel: 'mobile' | 'branch';
    status: 'successful' | 'failed';
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const SchoolPaymentSchema: import("mongoose").Schema<SchoolPayment, import("mongoose").Model<SchoolPayment, any, any, any, import("mongoose").Document<unknown, any, SchoolPayment, any, {}> & SchoolPayment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SchoolPayment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<SchoolPayment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SchoolPayment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
