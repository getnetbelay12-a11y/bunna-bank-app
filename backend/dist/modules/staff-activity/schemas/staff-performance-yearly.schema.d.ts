import { HydratedDocument, Types } from 'mongoose';
export type StaffPerformanceYearlyDocument = HydratedDocument<StaffPerformanceYearly>;
export declare class StaffPerformanceYearly {
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
export declare const StaffPerformanceYearlySchema: import("mongoose").Schema<StaffPerformanceYearly, import("mongoose").Model<StaffPerformanceYearly, any, any, any, import("mongoose").Document<unknown, any, StaffPerformanceYearly, any, {}> & StaffPerformanceYearly & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StaffPerformanceYearly, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StaffPerformanceYearly>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StaffPerformanceYearly> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
