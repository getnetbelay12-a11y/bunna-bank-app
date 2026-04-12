import { HydratedDocument, Types } from 'mongoose';
import { LoanAction, LoanStatus, LoanWorkflowLevel, UserRole } from '../../../common/enums';
export type LoanWorkflowHistoryDocument = HydratedDocument<LoanWorkflowHistory>;
export declare class LoanWorkflowHistory {
    loanId: Types.ObjectId;
    action: LoanAction;
    level: LoanWorkflowLevel;
    fromStatus: LoanStatus;
    toStatus: LoanStatus;
    actorId?: Types.ObjectId;
    actorRole?: UserRole;
    comment?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const LoanWorkflowHistorySchema: import("mongoose").Schema<LoanWorkflowHistory, import("mongoose").Model<LoanWorkflowHistory, any, any, any, import("mongoose").Document<unknown, any, LoanWorkflowHistory, any, {}> & LoanWorkflowHistory & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LoanWorkflowHistory, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LoanWorkflowHistory>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<LoanWorkflowHistory> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
