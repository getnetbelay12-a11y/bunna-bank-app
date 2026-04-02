import { HydratedDocument, Types } from 'mongoose';
import { MemberType, UserRole } from '../../../common/enums';
export type MemberDocument = HydratedDocument<Member>;
export declare class Member {
    customerId: string;
    memberNumber: string;
    memberType: MemberType;
    role: UserRole;
    fullName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    region?: string;
    city?: string;
    preferredBranchName?: string;
    branchId: Types.ObjectId;
    districtId: Types.ObjectId;
    shareBalance: number;
    faydaFin?: string;
    passwordHash: string;
    pinHash?: string;
    kycStatus: string;
    isActive: boolean;
}
export declare const MemberSchema: import("mongoose").Schema<Member, import("mongoose").Model<Member, any, any, any, import("mongoose").Document<unknown, any, Member, any, {}> & Member & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Member, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Member>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Member> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
