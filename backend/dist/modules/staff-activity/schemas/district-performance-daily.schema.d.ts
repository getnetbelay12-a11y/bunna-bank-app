import { HydratedDocument, Types } from 'mongoose';
export type DistrictPerformanceDailyDocument = HydratedDocument<DistrictPerformanceDaily>;
export declare class DistrictPerformanceDaily {
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
export declare const DistrictPerformanceDailySchema: import("mongoose").Schema<DistrictPerformanceDaily, import("mongoose").Model<DistrictPerformanceDaily, any, any, any, import("mongoose").Document<unknown, any, DistrictPerformanceDaily, any, {}> & DistrictPerformanceDaily & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DistrictPerformanceDaily, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<DistrictPerformanceDaily>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<DistrictPerformanceDaily> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
