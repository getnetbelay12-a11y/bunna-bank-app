import { HydratedDocument, Types } from 'mongoose';
import { InsurancePolicyStatus } from '../../../common/enums';
export type InsurancePolicyDocument = HydratedDocument<InsurancePolicy>;
export declare class InsurancePolicy {
    memberId: Types.ObjectId;
    policyNumber: string;
    providerName: string;
    insuranceType: string;
    linkedLoanId?: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: InsurancePolicyStatus;
    renewalReminderSent: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const InsurancePolicySchema: import("mongoose").Schema<InsurancePolicy, import("mongoose").Model<InsurancePolicy, any, any, any, import("mongoose").Document<unknown, any, InsurancePolicy, any, {}> & InsurancePolicy & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, InsurancePolicy, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<InsurancePolicy>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<InsurancePolicy> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
