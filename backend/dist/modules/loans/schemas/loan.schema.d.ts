import { HydratedDocument, Types } from 'mongoose';
import { LoanStatus, LoanWorkflowLevel } from '../../../common/enums';
export type LoanDocument = HydratedDocument<Loan>;
export declare class Loan {
    memberId: Types.ObjectId;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    loanType: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    status: LoanStatus;
    currentLevel: LoanWorkflowLevel;
    assignedToStaffId?: Types.ObjectId;
    deficiencyReasons: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const LoanSchema: import("mongoose").Schema<Loan, import("mongoose").Model<Loan, any, any, any, import("mongoose").Document<unknown, any, Loan, any, {}> & Loan & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Loan, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Loan>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Loan> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
