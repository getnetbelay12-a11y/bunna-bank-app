import { HydratedDocument, Types } from 'mongoose';
import { ActivityType } from '../../../common/enums';
export type StaffActivityLogDocument = HydratedDocument<StaffActivityLog>;
export declare class StaffActivityLog {
    staffId: Types.ObjectId;
    memberId?: Types.ObjectId;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    activityType: ActivityType;
    referenceType?: string;
    referenceId?: Types.ObjectId;
    amount: number;
}
export declare const StaffActivityLogSchema: import("mongoose").Schema<StaffActivityLog, import("mongoose").Model<StaffActivityLog, any, any, any, import("mongoose").Document<unknown, any, StaffActivityLog, any, {}> & StaffActivityLog & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StaffActivityLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StaffActivityLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<StaffActivityLog> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
