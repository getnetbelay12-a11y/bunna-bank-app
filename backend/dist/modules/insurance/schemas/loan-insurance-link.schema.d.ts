import { HydratedDocument, Types } from 'mongoose';
export type LoanInsuranceLinkDocument = HydratedDocument<LoanInsuranceLink>;
export declare class LoanInsuranceLink {
    loanId: Types.ObjectId;
    insurancePolicyId: Types.ObjectId;
    memberId: Types.ObjectId;
    relationType: string;
    createdAt?: Date;
}
export declare const LoanInsuranceLinkSchema: import("mongoose").Schema<LoanInsuranceLink, import("mongoose").Model<LoanInsuranceLink, any, any, any, import("mongoose").Document<unknown, any, LoanInsuranceLink, any, {}> & LoanInsuranceLink & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LoanInsuranceLink, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LoanInsuranceLink>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<LoanInsuranceLink> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
