import { HydratedDocument, Types } from 'mongoose';
export type AutopaySettingDocument = HydratedDocument<AutopaySetting>;
export declare class AutopaySetting {
    memberId: Types.ObjectId;
    serviceType: string;
    accountId: string;
    schedule: string;
    enabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const AutopaySettingSchema: import("mongoose").Schema<AutopaySetting, import("mongoose").Model<AutopaySetting, any, any, any, import("mongoose").Document<unknown, any, AutopaySetting, any, {}> & AutopaySetting & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AutopaySetting, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AutopaySetting>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AutopaySetting> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
