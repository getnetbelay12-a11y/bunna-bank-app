import { HydratedDocument, Types } from 'mongoose';
export type MemberSecuritySettingDocument = HydratedDocument<MemberSecuritySetting>;
export declare class MemberSecuritySetting {
    memberId: Types.ObjectId;
    accountLockEnabled: boolean;
}
export declare const MemberSecuritySettingSchema: import("mongoose").Schema<MemberSecuritySetting, import("mongoose").Model<MemberSecuritySetting, any, any, any, import("mongoose").Document<unknown, any, MemberSecuritySetting, any, {}> & MemberSecuritySetting & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MemberSecuritySetting, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<MemberSecuritySetting>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MemberSecuritySetting> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
