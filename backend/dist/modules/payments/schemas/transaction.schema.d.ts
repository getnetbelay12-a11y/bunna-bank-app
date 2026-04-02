import { HydratedDocument, Types } from 'mongoose';
import { PaymentType } from '../../../common/enums';
export type TransactionDocument = HydratedDocument<Transaction>;
export declare class Transaction {
    transactionReference: string;
    memberId: Types.ObjectId;
    staffId?: Types.ObjectId;
    accountId: Types.ObjectId;
    branchId: Types.ObjectId;
    type: PaymentType;
    channel: 'mobile' | 'branch';
    amount: number;
    currency: string;
    externalReference?: string;
    narration?: string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, import("mongoose").Document<unknown, any, Transaction, any, {}> & Transaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Transaction>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Transaction> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
