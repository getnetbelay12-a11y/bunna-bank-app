import { HydratedDocument, Types } from 'mongoose';
export type SavingsAccountDocument = HydratedDocument<SavingsAccount>;
export declare class SavingsAccount {
    accountNumber: string;
    memberId: Types.ObjectId;
    branchId: Types.ObjectId;
    balance: number;
    currency: string;
    isActive: boolean;
}
export declare const SavingsAccountSchema: import("mongoose").Schema<SavingsAccount, import("mongoose").Model<SavingsAccount, any, any, any, import("mongoose").Document<unknown, any, SavingsAccount, any, {}> & SavingsAccount & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SavingsAccount, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<SavingsAccount>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<SavingsAccount> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
