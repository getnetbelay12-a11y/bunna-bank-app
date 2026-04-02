import { HydratedDocument, Types } from 'mongoose';
export type StaffPerformanceDailyDocument = HydratedDocument<StaffPerformanceDaily>;
export declare class StaffPerformanceDaily {
    staffId: Types.ObjectId;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    periodStart: Date;
    customersHelped: number;
    membersServed: number;
    transactionsCount: number;
    loansHandled: number;
    loanApplicationsCount: number;
    loanApprovedCount: number;
    loanRejectedCount: number;
    loansEscalated: number;
    kycCompleted: number;
    supportResolved: number;
    tasksCompleted: number;
    avgHandlingTime: number;
    responseTimeMinutes: number;
    pendingTasks: number;
    schoolPaymentsCount: number;
    totalTransactionAmount: number;
    score: number;
    status: 'excellent' | 'good' | 'watch' | 'needs_support';
}
export declare const StaffPerformanceDailySchema: import("mongoose").Schema<StaffPerformanceDaily, import("mongoose").Model<StaffPerformanceDaily, any, any, any, import("mongoose").Document<unknown, any, StaffPerformanceDaily, any, {}> & StaffPerformanceDaily & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StaffPerformanceDaily, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StaffPerformanceDaily>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StaffPerformanceDaily> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
