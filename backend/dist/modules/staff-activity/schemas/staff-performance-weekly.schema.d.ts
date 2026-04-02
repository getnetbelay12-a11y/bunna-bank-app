import { HydratedDocument, Types } from 'mongoose';
export type StaffPerformanceWeeklyDocument = HydratedDocument<StaffPerformanceWeekly>;
export declare class StaffPerformanceWeekly {
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
export declare const StaffPerformanceWeeklySchema: import("mongoose").Schema<StaffPerformanceWeekly, import("mongoose").Model<StaffPerformanceWeekly, any, any, any, import("mongoose").Document<unknown, any, StaffPerformanceWeekly, any, {}> & StaffPerformanceWeekly & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StaffPerformanceWeekly, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StaffPerformanceWeekly>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StaffPerformanceWeekly> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
