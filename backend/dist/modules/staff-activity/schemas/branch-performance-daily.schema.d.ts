import { HydratedDocument, Types } from 'mongoose';
export type BranchPerformanceDailyDocument = HydratedDocument<BranchPerformanceDaily>;
export declare class BranchPerformanceDaily {
    branchId: Types.ObjectId;
    branchName: string;
    districtId: Types.ObjectId;
    districtName: string;
    date: Date;
    membersServed: number;
    customersHelped: number;
    loansHandled: number;
    loansApproved: number;
    loansEscalated: number;
    kycCompleted: number;
    supportResolved: number;
    transactionsProcessed: number;
    avgHandlingTime: number;
    pendingTasks: number;
    pendingApprovals: number;
    responseTimeMinutes: number;
    score: number;
    status: 'excellent' | 'good' | 'watch' | 'needs_support';
}
export declare const BranchPerformanceDailySchema: import("mongoose").Schema<BranchPerformanceDaily, import("mongoose").Model<BranchPerformanceDaily, any, any, any, import("mongoose").Document<unknown, any, BranchPerformanceDaily, any, {}> & BranchPerformanceDaily & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BranchPerformanceDaily, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<BranchPerformanceDaily>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<BranchPerformanceDaily> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
