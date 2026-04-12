import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../../../common/enums';
export type StaffDocument = HydratedDocument<Staff>;
export declare class Staff {
    staffNumber: string;
    fullName: string;
    identifier: string;
    phone: string;
    email?: string;
    role: UserRole;
    branchId?: Types.ObjectId;
    districtId?: Types.ObjectId;
    permissions: string[];
    passwordHash: string;
    isActive: boolean;
}
export declare const StaffSchema: import("mongoose").Schema<Staff, import("mongoose").Model<Staff, any, any, any, import("mongoose").Document<unknown, any, Staff, any, {}> & Staff & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Staff, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Staff>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Staff> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
